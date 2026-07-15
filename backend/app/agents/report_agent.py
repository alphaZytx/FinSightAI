import asyncio
import logging
from pathlib import Path

from app.agents.base_agent import AgentResult, BaseAgent
from app.agents.comparison_agent import ComparisonAgent
from app.repositories.document_repository import DocumentRepository
from app.repositories.metric_repository import MetricRepository
from app.repositories.red_flag_repository import RedFlagRepository
from app.services.llm_service import LLMService
from app.services.pdf_report_service import PDFReportService

logger = logging.getLogger("finsight-ai")

_REPORT_SYSTEM_PROMPT = Path(__file__).resolve().parent.parent / "prompts" / "report_prompt.md"

FINANCIAL_PRIORITY = ["revenue", "ebitda", "net_income", "gross_margin", "operating_margin", "net_margin", "free_cash_flow"]
LIQUIDITY_PRIORITY = ["cash", "current_ratio", "total_debt", "debt_to_equity", "debt_to_ebitda", "operating_cash_flow"]


def _load_report_prompt() -> str:
    try:
        return _REPORT_SYSTEM_PROMPT.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return "You are a professional financial analyst writing a research report. Be precise and analytical."


class ReportAgent(BaseAgent):
    name = "ReportAgent"
    description = "Compiles citable workspace evidence into an analyst-style PDF report with LLM-synthesized narrative."

    def __init__(self, llm_provider: str = "groq") -> None:
        self.pdf_service = PDFReportService()
        self.documents = DocumentRepository()
        self.metrics = MetricRepository()
        self.red_flags = RedFlagRepository()
        self.comparison = ComparisonAgent()
        self.llm = LLMService(provider=llm_provider)

    async def run(self, state: dict) -> AgentResult:
        title = state.get("title", "FinSightAI Analyst Report")
        workspace_id = state.get("workspace_id")
        requested_companies = set(state.get("company_names") or [])
        sections = state.get("sections")
        report_context = {}
        if not sections and workspace_id:
            sections, report_context = await self._build_workspace_sections(workspace_id, requested_companies)
        if not sections:
            sections = [{"heading": "Executive Summary", "content": "No workspace evidence was provided for this report."}]

        if not workspace_id:
            workspace_id = "default"

        path = self.pdf_service.generate_simple_report(title, sections, workspace_id)
        return AgentResult(
            agent_name=self.name,
            status="success",
            output={
                "report_path": path,
                "report_url": f"/reports-files/{workspace_id}/{Path(path).name}",
                "sections": sections,
                "coverage": report_context,
            },
        )

    async def _build_workspace_sections(self, workspace_id: str, requested_companies: set[str]) -> tuple[list[dict], dict]:
        documents = await self.documents.find_by_workspace(workspace_id)
        metrics = await self.metrics.find_by_workspace(workspace_id, limit=500)
        flags = await self.red_flags.find_by_workspace(workspace_id, limit=500)
        if requested_companies:
            documents = [item for item in documents if item.get("company_name") in requested_companies]
            metrics = [item for item in metrics if item.get("company_name") in requested_companies]
            flags = [item for item in flags if item.get("company_name") in requested_companies]

        companies = sorted({item.get("company_name", "Unknown company") for item in documents})
        context = {
            "companies": companies,
            "documents": len(documents),
            "metrics": len(metrics),
            "red_flags": len(flags),
        }
        comparison_result = await self.comparison.run({"workspace_id": workspace_id})
        comparison = comparison_result.output if comparison_result.status == "success" else {}
        if requested_companies:
            comparison = self._filter_comparison(comparison, requested_companies)

        system_prompt = _load_report_prompt()

        # Build raw data context for LLM synthesis
        financial_data = self._metric_lines(metrics, FINANCIAL_PRIORITY)
        liquidity_data = self._metric_lines(metrics, LIQUIDITY_PRIORITY)
        risk_data = self._risk_lines(flags)
        comparison_data = self._comparison_lines(comparison)
        citation_data = self._citation_lines(metrics, flags)

        # Use LLM to synthesize each section
        exec_summary = await self._llm_synthesize(
            system_prompt,
            "Executive Summary",
            f"Write a professional executive summary for this analyst report.\n\n"
            f"Companies: {', '.join(companies) or 'Unknown'}\n"
            f"Documents analyzed: {context['documents']}\n"
            f"Metrics extracted: {context['metrics']}\n"
            f"Risk signals detected: {context['red_flags']}\n\n"
            f"Key Financial Data:\n{financial_data}\n\n"
            f"Risk Signals:\n{risk_data}\n\n"
            f"Peer Comparison:\n{comparison_data}",
            fallback=self._executive_summary(context, flags, comparison),
        )

        key_financials = await self._llm_synthesize(
            system_prompt,
            "Key Financials",
            f"Write an analytical commentary on the key financial metrics below. "
            f"Don't just list numbers — explain what they mean, identify trends, and highlight notable items.\n\n"
            f"Data:\n{financial_data}",
            fallback=financial_data,
        )

        liquidity_section = await self._llm_synthesize(
            system_prompt,
            "Liquidity and Leverage",
            f"Write an analytical assessment of the company's liquidity position and leverage. "
            f"Evaluate debt levels, cash adequacy, and any refinancing considerations.\n\n"
            f"Data:\n{liquidity_data}",
            fallback=liquidity_data,
        )

        risk_section = await self._llm_synthesize(
            system_prompt,
            "Red Flags and Risk Indicators",
            f"Write a professional risk assessment section. Group related risks, explain potential impacts, "
            f"and suggest areas for further investigation.\n\n"
            f"Risk Signals:\n{risk_data}",
            fallback=risk_data,
        )

        peer_section = await self._llm_synthesize(
            system_prompt,
            "Peer Comparison",
            f"Write a peer comparison analysis. Identify where the company leads or trails, "
            f"and note significant divergences.\n\n"
            f"Comparison Data:\n{comparison_data}",
            fallback=comparison_data,
        )

        sections = [
            {"heading": "Executive Summary", "content": exec_summary},
            {"heading": "Key Financials", "content": key_financials},
            {"heading": "Liquidity and Leverage", "content": liquidity_section},
            {"heading": "Red Flags and Risk Indicators", "content": risk_section},
            {"heading": "Peer Comparison", "content": peer_section},
            {"heading": "Source Citation Appendix", "content": citation_data},
        ]
        return sections, context

    async def _llm_synthesize(self, system_prompt: str, section_name: str, user_prompt: str, fallback: str) -> str:
        """Use LLM to synthesize a report section, falling back to raw data on failure."""
        try:
            full_prompt = (
                f"You are writing the \"{section_name}\" section of a financial analyst report.\n\n"
                f"{user_prompt}\n\n"
                f"Write 2-4 paragraphs of professional analyst prose. Include specific numbers and source page references "
                f"where available. Do NOT use markdown headers — just write flowing paragraphs."
            )
            result = await asyncio.to_thread(
                self.llm.complete, system_prompt, full_prompt, max_tokens=2048, temperature=0.3
            )
            if result and len(result.strip()) > 50:
                return result.strip()
        except Exception as exc:
            logger.warning("LLM synthesis failed for section '%s': %s", section_name, exc)
        return fallback

    def _executive_summary(self, context: dict, flags: list[dict], comparison: dict) -> str:
        high_priority = sum(str(flag.get("severity", "")).lower() in {"critical", "high"} for flag in flags)
        comparable = comparison.get("coverage", {}).get("comparable_metric_rows", 0)
        company_label = ", ".join(context["companies"]) if context["companies"] else "no identified companies"
        return (
            f"This source-grounded report covers {context['documents']} indexed document(s) for {company_label}. "
            f"It includes {context['metrics']} extracted metrics and {context['red_flags']} detected risk indicator(s), "
            f"including {high_priority} critical or high-severity item(s). "
            f"{comparable} metric row(s) are comparable across the selected peer set. "
            "All findings should be reviewed against the cited filing pages before use in final analysis."
        )

    def _metric_lines(self, metrics: list[dict], priority: list[str]) -> str:
        ranked = sorted(
            [metric for metric in metrics if metric.get("metric_name") in priority],
            key=lambda metric: (priority.index(metric.get("metric_name")), metric.get("company_name", ""), str(metric.get("period") or "")),
        )
        if not ranked:
            return "No extracted source-backed metrics are available for this section."
        lines = []
        seen: set[tuple[str, str, str]] = set()
        for metric in ranked:
            key = (metric.get("company_name", ""), metric.get("metric_name", ""), str(metric.get("period") or ""))
            if key in seen:
                continue
            seen.add(key)
            lines.append(
                f"{metric.get('company_name')}: {metric.get('display_name') or metric.get('metric_name')} "
                f"{metric.get('period') or ''} = {self._format_metric(metric)} (page {metric.get('source_page') or 'n/a'})."
            )
        return "\n".join(lines[:24])

    def _risk_lines(self, flags: list[dict]) -> str:
        if not flags:
            return "No red flags were detected by the current source-grounded rules."
        severity_rank = {"critical": 4, "high": 3, "medium": 2, "low": 1}
        ordered = sorted(flags, key=lambda flag: (-severity_rank.get(str(flag.get("severity", "low")).lower(), 0), flag.get("company_name", "")))
        return "\n".join(
            f"[{str(flag.get('severity', 'medium')).upper()}] {flag.get('company_name')}: {flag.get('title')} - "
            f"{flag.get('explanation')} (page {flag.get('source_page') or 'n/a'})."
            for flag in ordered[:18]
        )

    def _comparison_lines(self, comparison: dict) -> str:
        insights = comparison.get("benchmark_insights", [])
        if not insights:
            return "Peer comparison requires comparable metrics from at least two companies."
        return "\n".join(
            f"{item.get('title')}: {item.get('detail')}"
            for item in insights[:8]
        )

    def _citation_lines(self, metrics: list[dict], flags: list[dict]) -> str:
        lines = []
        for metric in metrics[:24]:
            lines.append(
                f"Metric | {metric.get('company_name')} | {metric.get('display_name') or metric.get('metric_name')} | "
                f"page {metric.get('source_page') or 'n/a'} | document {metric.get('document_id')}"
            )
        for flag in flags[:18]:
            lines.append(
                f"Risk | {flag.get('company_name')} | {flag.get('title')} | page {flag.get('source_page') or 'n/a'} | "
                f"document {flag.get('document_id')}"
            )
        return "\n".join(lines) or "No citations are available because the workspace has no saved evidence."

    def _filter_comparison(self, comparison: dict, companies: set[str]) -> dict:
        filtered = {**comparison}
        filtered["benchmark_insights"] = [
            item for item in comparison.get("benchmark_insights", [])
            if item.get("leader") in companies and item.get("trailing_company") in companies
        ]
        return filtered

    def _format_metric(self, metric: dict) -> str:
        value = metric.get("value")
        try:
            number = float(value)
        except (TypeError, ValueError):
            return "not reported"
        unit = metric.get("unit")
        if unit == "percent":
            return f"{number:,.2f}%"
        if unit == "x":
            return f"{number:,.2f}x"
        return f"{number:,.2f}{f' {unit}' if unit else ''}"
