from app.agents.base_agent import BaseAgent, AgentResult
from app.repositories.metric_repository import MetricRepository
from app.repositories.red_flag_repository import RedFlagRepository
from app.services.pdf_report_service import PDFReportService


class ReportAgent(BaseAgent):
    name = "ReportAgent"
    description = "Generates analyst-style PDF reports."

    def __init__(self) -> None:
        self.pdf_service = PDFReportService()
        self.metrics = MetricRepository()
        self.red_flags = RedFlagRepository()

    async def run(self, state: dict) -> AgentResult:
        title = state.get("title", "FinSightAI Analyst Report")
        sections = state.get("sections")
        workspace_id = state.get("workspace_id")
        if not sections and workspace_id:
            sections = await self._build_workspace_sections(workspace_id)
        if not sections:
            sections = [{"heading": "Executive Summary", "content": "No workspace evidence was provided for this report."}]
        path = self.pdf_service.generate_simple_report(title, sections)
        return AgentResult(agent_name=self.name, status="success", output={"report_path": path, "sections": sections})

    async def _build_workspace_sections(self, workspace_id: str) -> list[dict]:
        metrics = await self.metrics.find_by_workspace(workspace_id, limit=50)
        red_flags = await self.red_flags.find_by_workspace(workspace_id, limit=50)
        metric_lines = [
            f"{item.get('company_name')}: {item.get('display_name') or item.get('metric_name')} {item.get('period') or ''} = {item.get('value')} ({item.get('unit') or 'reported units'}), page {item.get('source_page')}"
            for item in metrics[:12]
        ]
        risk_lines = [
            f"{item.get('company_name')}: {item.get('title')} ({item.get('severity')}), page {item.get('source_page')}"
            for item in red_flags[:12]
        ]
        return [
            {
                "heading": "Executive Summary",
                "content": "This report was generated from indexed source documents and deterministic extraction rules.",
            },
            {
                "heading": "Key Financials",
                "content": "\n".join(metric_lines) if metric_lines else "No extracted metrics are available yet.",
            },
            {
                "heading": "Red Flags and Risk Indicators",
                "content": "\n".join(risk_lines) if risk_lines else "No red flags were detected by the current rules.",
            },
            {
                "heading": "Source Citation Appendix",
                "content": "Every metric and risk line includes its source page. Review the cited document page before using the output in final analysis.",
            },
        ]