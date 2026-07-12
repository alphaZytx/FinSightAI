import asyncio
from collections import defaultdict
from pathlib import Path
from uuid import uuid4

from app.agents.base_agent import AgentResult, BaseAgent
from app.repositories.chunk_repository import ChunkRepository
from app.repositories.document_repository import DocumentRepository
from app.repositories.metric_repository import MetricRepository
from app.repositories.red_flag_repository import RedFlagRepository
from app.services.llm_service import LLMService


RISK_RULES = [
    ("going_concern", "critical", "Going concern language", ["going concern", "substantial doubt"]),
    ("audit", "high", "Audit or control concern", ["material weakness", "qualified opinion", "adverse opinion"]),
    ("liquidity", "high", "Liquidity pressure", ["liquidity risk", "working capital deficit", "negative cash flow"]),
    ("leverage", "medium", "Debt or leverage risk", ["debt covenant", "high leverage", "borrowings increased", "debt increased"]),
    ("legal", "medium", "Legal or contingent liability", ["litigation", "contingent liability", "legal proceedings"]),
    ("related_party", "medium", "Related-party exposure", ["related party", "related-party"]),
    ("concentration", "medium", "Concentration risk", ["major customer", "customer concentration", "single customer"]),
    ("profitability", "medium", "Profitability pressure", ["margin declined", "decline in margin", "net loss"]),
]

_RED_FLAG_SYSTEM_PROMPT = Path(__file__).resolve().parent.parent / "prompts" / "red_flag_prompt.md"


def _load_red_flag_prompt() -> str:
    try:
        return _RED_FLAG_SYSTEM_PROMPT.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return (
            "You are the Red Flag Agent for FinSightAI. Identify risks using only the supplied "
            "evidence. Do not introduce facts not present in the evidence."
        )


class RedFlagAgent(BaseAgent):
    name = "RedFlagAgent"
    description = "Detects cited qualitative and quantitative financial risks."

    def __init__(self, llm_provider: str = "groq") -> None:
        self.documents = DocumentRepository()
        self.chunks = ChunkRepository()
        self.metrics = MetricRepository()
        self.red_flags = RedFlagRepository()
        self.llm = LLMService(provider=llm_provider)

    async def run(self, state: dict) -> AgentResult:
        document_id = state.get("document_id")
        if not document_id:
            return AgentResult(agent_name=self.name, status="failed", errors=["document_id is required"])

        document = await self.documents.get_by_id(document_id)
        if not document:
            return AgentResult(agent_name=self.name, status="failed", errors=["Document not found"])

        chunks = await self.chunks.find_by_document(document_id)
        metrics = await self.metrics.find_by_document(document_id)
        flags = self._detect_flags(document, chunks, metrics)
        flags = await self._enhance_explanations(flags)

        await self.red_flags.delete_by_document(document_id)
        inserted = await self.red_flags.insert_many(flags)
        severity_counts = {severity: sum(flag["severity"] == severity for flag in flags) for severity in ("critical", "high", "medium", "low")}
        return AgentResult(
            agent_name=self.name,
            status="success",
            output={"red_flags": flags, "red_flags_saved": inserted, "severity_counts": severity_counts},
        )

    async def _enhance_explanations(self, flags: list[dict]) -> list[dict]:
        """Polish detected evidence without creating new red flags or changing citations."""
        if not flags:
            return flags
        descriptions = []
        for index, flag in enumerate(flags, 1):
            descriptions.append(
                f"{index}. Category: {flag['category']} | Severity: {flag['severity']} | "
                f"Title: {flag['title']}\nEvidence: {flag.get('evidence', 'N/A')[:300]}"
            )
        prompt = (
            f"Company: {flags[0].get('company_name', 'Unknown')}\n\n"
            "Write one concise analyst explanation for each supplied flag. Keep numerical values and "
            "evidence intact. Do not speculate, introduce new risks, or cite a different page.\n\n"
            + "\n".join(descriptions)
            + "\n\nReturn one numbered explanation per line."
        )
        raw = await asyncio.to_thread(self.llm.complete, _load_red_flag_prompt(), prompt, max_tokens=1200)
        if not raw:
            return flags

        lines = [line.strip() for line in raw.splitlines() if line.strip()]
        for index, flag in enumerate(flags, 1):
            matched = next((line for line in lines if line.startswith(f"{index}.") or line.startswith(f"{index})")), None)
            if not matched:
                continue
            explanation = matched.split(".", 1)[-1].strip() if "." in matched[:4] else matched.split(")", 1)[-1].strip()
            if len(explanation) >= 24:
                flag["explanation"] = explanation
        return flags

    def _detect_flags(self, document: dict, chunks: list[dict], metrics: list[dict]) -> list[dict]:
        flags = self._detect_keyword_flags(document, chunks)
        flagged_categories = {flag["category"] for flag in flags}
        for flag in self._detect_quantitative_flags(document, metrics):
            if flag["category"] not in flagged_categories:
                flags.append(flag)
                flagged_categories.add(flag["category"])
        return flags

    def _detect_keyword_flags(self, document: dict, chunks: list[dict]) -> list[dict]:
        flags: list[dict] = []
        seen_categories: set[str] = set()
        for chunk in chunks:
            text = " ".join(chunk.get("text", "").split())
            lowered = text.lower()
            for category, severity, title, keywords in RISK_RULES:
                if category in seen_categories:
                    continue
                keyword = next((item for item in keywords if item in lowered), None)
                if not keyword:
                    continue
                seen_categories.add(category)
                start = max(lowered.find(keyword) - 120, 0)
                flags.append(
                    self._flag_record(
                        document=document,
                        category=category,
                        severity=severity,
                        title=title,
                        explanation=(
                            f"The filing contains language related to '{keyword}'. Review the cited "
                            "source before treating this as a final investment conclusion."
                        ),
                        source_chunk_id=chunk["_id"],
                        source_page=chunk.get("page_start"),
                        evidence=text[start : start + 360],
                        confidence=0.68,
                        detection_method="keyword_evidence",
                    )
                )
        return flags

    def _detect_quantitative_flags(self, document: dict, metrics: list[dict]) -> list[dict]:
        flags: list[dict] = []
        by_name: dict[str, list[dict]] = defaultdict(list)
        for metric in metrics:
            if metric.get("extraction_method") == "llm_review":
                continue
            if self._metric_value(metric) is not None:
                by_name[metric.get("metric_name", "")].append(metric)

        debt_series = self._ordered_series(by_name.get("total_debt", []))
        if len(debt_series) >= 2:
            previous, current = debt_series[-2:]
            increase = self._percent_change(self._metric_value(previous), self._metric_value(current))
            if increase is not None and increase >= 15:
                flags.append(self._trend_flag(document, "leverage", "high" if increase >= 30 else "medium", "Debt increased materially", previous, current, increase, "increased"))

        for metric_name, title in (("gross_margin", "Gross margin declined"), ("operating_margin", "Operating margin declined"), ("net_margin", "Net margin declined")):
            series = self._ordered_series(by_name.get(metric_name, []))
            if len(series) < 2:
                continue
            previous, current = series[-2:]
            change = self._metric_value(current) - self._metric_value(previous)
            if change <= -1.0:
                flags.append(
                    self._flag_record(
                        document=document,
                        category="profitability",
                        severity="high" if change <= -5 else "medium",
                        title=title,
                        explanation=(
                            f"{current.get('display_name', metric_name)} moved from {self._metric_value(previous):.2f}% "
                            f"in {previous.get('period') or 'the prior period'} to {self._metric_value(current):.2f}% "
                            f"in {current.get('period') or 'the latest period'} ({change:.2f} percentage points)."
                        ),
                        source_chunk_id=current.get("source_chunk_id", ""),
                        source_page=current.get("source_page"),
                        evidence=current.get("evidence", ""),
                        confidence=min(previous.get("confidence", 0.6), current.get("confidence", 0.6)),
                        detection_method="metric_trend",
                    )
                )
                break

        current_ratio = self._latest_metric(by_name.get("current_ratio", []))
        if current_ratio and self._metric_value(current_ratio) < 1:
            flags.append(self._metric_flag(document, "liquidity", "high", "Current ratio below 1.0", current_ratio, "A current ratio below 1.0 can indicate near-term liquidity pressure."))

        leverage_ratio = self._latest_metric(by_name.get("debt_to_ebitda", []))
        if leverage_ratio and self._metric_value(leverage_ratio) > 4:
            flags.append(self._metric_flag(document, "leverage", "high", "Debt to EBITDA above 4x", leverage_ratio, "Leverage above 4x can constrain financial flexibility and debt capacity."))

        operating_cash_flow = self._latest_metric(by_name.get("operating_cash_flow", []))
        if operating_cash_flow and self._metric_value(operating_cash_flow) < 0:
            flags.append(self._metric_flag(document, "cash_flow", "high", "Negative operating cash flow", operating_cash_flow, "Negative cash flow from operations may indicate that operating activity is consuming cash."))

        net_income = self._latest_metric(by_name.get("net_income", []))
        if net_income and self._metric_value(net_income) < 0:
            flags.append(self._metric_flag(document, "profitability", "medium", "Reported net loss", net_income, "The extracted net income value is below zero for the cited period."))
        return flags

    def _trend_flag(self, document: dict, category: str, severity: str, title: str, previous: dict, current: dict, change: float, direction: str) -> dict:
        return self._flag_record(
            document=document,
            category=category,
            severity=severity,
            title=title,
            explanation=(
                f"{current.get('display_name', 'Metric')} {direction} by {change:.1f}% from "
                f"{previous.get('period') or 'the prior period'} to {current.get('period') or 'the latest period'} "
                "based on extracted values from the cited filing."
            ),
            source_chunk_id=current.get("source_chunk_id", ""),
            source_page=current.get("source_page"),
            evidence=current.get("evidence", ""),
            confidence=min(previous.get("confidence", 0.6), current.get("confidence", 0.6)),
            detection_method="metric_trend",
        )

    def _metric_flag(self, document: dict, category: str, severity: str, title: str, metric: dict, interpretation: str) -> dict:
        unit = metric.get("unit") or "reported units"
        return self._flag_record(
            document=document,
            category=category,
            severity=severity,
            title=title,
            explanation=f"{metric.get('display_name', 'Metric')} is {self._metric_value(metric):.2f} {unit}. {interpretation}",
            source_chunk_id=metric.get("source_chunk_id", ""),
            source_page=metric.get("source_page"),
            evidence=metric.get("evidence", ""),
            confidence=metric.get("confidence", 0.65),
            detection_method="metric_threshold",
        )

    def _flag_record(self, *, document: dict, category: str, severity: str, title: str, explanation: str, source_chunk_id: str, source_page: int | None, evidence: str, confidence: float, detection_method: str) -> dict:
        return {
            "_id": f"flag_{uuid4().hex[:12]}",
            "workspace_id": document["workspace_id"],
            "document_id": document["_id"],
            "company_name": document.get("company_name", "Unknown company"),
            "category": category,
            "severity": severity,
            "title": title,
            "explanation": explanation,
            "source_chunk_id": source_chunk_id,
            "source_page": source_page,
            "evidence": evidence[:500],
            "confidence": round(max(0.0, min(float(confidence), 1.0)), 2),
            "detection_method": detection_method,
        }

    def _ordered_series(self, metrics: list[dict]) -> list[dict]:
        best_by_period: dict[str, dict] = {}
        for metric in metrics:
            period = str(metric.get("period") or "")
            existing = best_by_period.get(period)
            if existing is None or metric.get("confidence", 0) > existing.get("confidence", 0):
                best_by_period[period] = metric
        return [best_by_period[key] for key in sorted(best_by_period, key=self._period_sort_key)]

    def _latest_metric(self, metrics: list[dict]) -> dict | None:
        series = self._ordered_series(metrics)
        return series[-1] if series else None

    def _metric_value(self, metric: dict) -> float | None:
        value = metric.get("normalized_value", metric.get("value"))
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    def _percent_change(self, previous: float | None, current: float | None) -> float | None:
        if previous is None or current is None or previous == 0:
            return None
        return (current - previous) / abs(previous) * 100

    def _period_sort_key(self, period: str) -> tuple[int, str]:
        digits = "".join(char for char in period if char.isdigit())
        return (int(digits[-4:]) if len(digits) >= 4 else -1, period)
