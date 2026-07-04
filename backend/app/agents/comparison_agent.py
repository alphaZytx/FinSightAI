from collections import defaultdict

from app.agents.base_agent import BaseAgent, AgentResult
from app.repositories.metric_repository import MetricRepository
from app.repositories.red_flag_repository import RedFlagRepository


class ComparisonAgent(BaseAgent):
    name = "ComparisonAgent"
    description = "Compares multiple companies using normalized metrics."

    def __init__(self) -> None:
        self.metrics = MetricRepository()
        self.red_flags = RedFlagRepository()

    async def run(self, state: dict) -> AgentResult:
        workspace_id = state.get("workspace_id")
        if not workspace_id:
            return AgentResult(agent_name=self.name, status="failed", errors=["workspace_id is required"])

        metrics = await self.metrics.find_by_workspace(workspace_id)
        red_flags = await self.red_flags.find_by_workspace(workspace_id)
        metric_rows = self._metric_rows(metrics)
        risk_summary = self._risk_summary(red_flags)
        return AgentResult(
            agent_name=self.name,
            status="success",
            output={"comparison": metric_rows, "risk_summary": risk_summary},
        )

    def _metric_rows(self, metrics: list[dict]) -> list[dict]:
        grouped: dict[tuple[str, str | None], dict] = {}
        for metric in metrics:
            key = (metric.get("metric_name", "unknown"), metric.get("period"))
            row = grouped.setdefault(key, {
                "metric_name": metric.get("display_name") or metric.get("metric_name", "unknown"),
                "period": metric.get("period"),
                "companies": {},
                "citations": [],
            })
            company = metric.get("company_name", "Unknown company")
            row["companies"][company] = metric.get("value")
            row["citations"].append({
                "company_name": company,
                "document_id": metric.get("document_id"),
                "page": metric.get("source_page"),
                "chunk_id": metric.get("source_chunk_id"),
                "evidence": metric.get("evidence"),
            })
        return list(grouped.values())

    def _risk_summary(self, red_flags: list[dict]) -> list[dict]:
        grouped: dict[str, dict] = defaultdict(lambda: {"count": 0, "severities": set(), "examples": []})
        for flag in red_flags:
            company = flag.get("company_name", "Unknown company")
            item = grouped[company]
            item["count"] += 1
            item["severities"].add(flag.get("severity", "unknown"))
            if len(item["examples"]) < 3:
                item["examples"].append(flag.get("title"))
        return [
            {
                "company_name": company,
                "red_flag_count": value["count"],
                "severities": sorted(value["severities"]),
                "examples": value["examples"],
            }
            for company, value in grouped.items()
        ]