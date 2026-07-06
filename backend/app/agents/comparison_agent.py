from collections import defaultdict

from app.agents.base_agent import AgentResult, BaseAgent
from app.repositories.metric_repository import MetricRepository
from app.repositories.red_flag_repository import RedFlagRepository


SEVERITY_ORDER = {"critical": 4, "high": 3, "medium": 2, "low": 1}
LOWER_IS_BETTER = {"total_debt", "debt_to_equity", "debt_to_ebitda"}


class ComparisonAgent(BaseAgent):
    name = "ComparisonAgent"
    description = "Benchmarks citable, normalized metrics across workspace companies."

    def __init__(self) -> None:
        self.metrics = MetricRepository()
        self.red_flags = RedFlagRepository()

    async def run(self, state: dict) -> AgentResult:
        workspace_id = state.get("workspace_id")
        if not workspace_id:
            return AgentResult(agent_name=self.name, status="failed", errors=["workspace_id is required"])

        metrics = await self.metrics.find_by_workspace(workspace_id)
        red_flags = await self.red_flags.find_by_workspace(workspace_id)
        rows = self._metric_rows(metrics)
        risk_summary = self._risk_summary(red_flags)
        companies = sorted({metric.get("company_name", "Unknown company") for metric in metrics} | {flag.get("company_name", "Unknown company") for flag in red_flags})
        comparable_rows = [row for row in rows if len(row["companies"]) >= 2]
        return AgentResult(
            agent_name=self.name,
            status="success",
            output={
                "comparison": rows,
                "benchmark_insights": self._benchmark_insights(comparable_rows),
                "risk_summary": risk_summary,
                "coverage": {
                    "company_count": len(companies),
                    "companies": companies,
                    "metric_rows": len(rows),
                    "comparable_metric_rows": len(comparable_rows),
                    "red_flags_considered": len(red_flags),
                },
            },
        )

    def _metric_rows(self, metrics: list[dict]) -> list[dict]:
        grouped: dict[tuple[str, str | None], dict] = {}
        for metric in metrics:
            metric_key = metric.get("metric_name", "unknown")
            period = metric.get("period")
            key = (metric_key, period)
            row = grouped.setdefault(
                key,
                {
                    "metric_key": metric_key,
                    "metric_name": metric.get("display_name") or metric_key.replace("_", " ").title(),
                    "period": period,
                    "companies": {},
                    "citations": [],
                },
            )
            company = metric.get("company_name", "Unknown company")
            candidate = self._metric_cell(metric)
            existing = row["companies"].get(company)
            if not existing or candidate["confidence"] > existing["confidence"]:
                row["companies"][company] = candidate
            row["citations"].append(
                {
                    "company_name": company,
                    "document_id": metric.get("document_id"),
                    "page": metric.get("source_page"),
                    "chunk_id": metric.get("source_chunk_id"),
                    "evidence": metric.get("evidence"),
                    "confidence": metric.get("confidence"),
                }
            )

        rows = []
        for row in grouped.values():
            cells = list(row["companies"].values())
            units = sorted({str(cell.get("unit") or "reported units") for cell in cells})
            row["normalization_note"] = (
                "Values are normalized to a common base where source units differ."
                if len(units) > 1
                else f"Reported unit: {units[0]}."
            )
            rows.append(row)
        return sorted(rows, key=lambda row: (row["metric_name"], self._period_sort_key(row.get("period"))))

    def _metric_cell(self, metric: dict) -> dict:
        value = self._as_number(metric.get("value"))
        normalized = self._as_number(metric.get("normalized_value"))
        if normalized is None:
            normalized = value
        unit = metric.get("unit")
        return {
            "value": value,
            "normalized_value": normalized,
            "unit": unit,
            "display_value": self._display_value(value, unit),
            "confidence": round(self._as_number(metric.get("confidence")) or 0, 2),
            "source_page": metric.get("source_page"),
            "document_id": metric.get("document_id"),
            "extraction_method": metric.get("extraction_method", "rule_based"),
        }

    def _benchmark_insights(self, rows: list[dict]) -> list[dict]:
        insights = []
        for row in rows:
            values = [(company, cell) for company, cell in row["companies"].items() if cell.get("normalized_value") is not None]
            if len(values) < 2:
                continue
            numbers = [cell["normalized_value"] for _, cell in values]
            if max(numbers) == min(numbers):
                continue
            reverse = row["metric_key"] not in LOWER_IS_BETTER
            ranked = sorted(values, key=lambda item: item[1]["normalized_value"], reverse=reverse)
            leader, leader_cell = ranked[0]
            trailing, trailing_cell = ranked[-1]
            direction = "higher" if reverse else "lower"
            insights.append(
                {
                    "metric_key": row["metric_key"],
                    "metric_name": row["metric_name"],
                    "period": row.get("period"),
                    "leader": leader,
                    "trailing_company": trailing,
                    "direction": direction,
                    "title": f"{leader} leads on {row['metric_name']}",
                    "detail": (
                        f"{leader} reports {leader_cell['display_value']} compared with "
                        f"{trailing} at {trailing_cell['display_value']} for {row.get('period') or 'the reported period'}."
                    ),
                    "citations": [
                        {"company_name": leader, "page": leader_cell.get("source_page"), "document_id": leader_cell.get("document_id")},
                        {"company_name": trailing, "page": trailing_cell.get("source_page"), "document_id": trailing_cell.get("document_id")},
                    ],
                }
            )
        return insights[:8]

    def _risk_summary(self, red_flags: list[dict]) -> list[dict]:
        grouped: dict[str, dict] = defaultdict(lambda: {"count": 0, "score": 0, "severities": set(), "examples": [], "critical_or_high": 0})
        for flag in red_flags:
            company = flag.get("company_name", "Unknown company")
            item = grouped[company]
            severity = str(flag.get("severity", "low")).lower()
            item["count"] += 1
            item["score"] += SEVERITY_ORDER.get(severity, 1)
            item["severities"].add(severity)
            if severity in {"critical", "high"}:
                item["critical_or_high"] += 1
            if len(item["examples"]) < 3:
                item["examples"].append(flag.get("title", "Untitled risk"))
        return sorted(
            [
                {
                    "company_name": company,
                    "red_flag_count": value["count"],
                    "risk_score": value["score"],
                    "critical_or_high": value["critical_or_high"],
                    "highest_severity": max(value["severities"], key=lambda severity: SEVERITY_ORDER.get(severity, 0), default="none"),
                    "severities": sorted(value["severities"], key=lambda severity: SEVERITY_ORDER.get(severity, 0), reverse=True),
                    "examples": value["examples"],
                }
                for company, value in grouped.items()
            ],
            key=lambda item: (-item["risk_score"], item["company_name"]),
        )

    def _display_value(self, value: float | None, unit: str | None) -> str:
        if value is None:
            return "Not reported"
        if unit == "percent":
            return f"{value:,.2f}%"
        if unit == "x":
            return f"{value:,.2f}x"
        suffix = f" {unit}" if unit else ""
        return f"{value:,.2f}{suffix}"

    def _as_number(self, value: object) -> float | None:
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    def _period_sort_key(self, period: str | None) -> tuple[int, str]:
        label = str(period or "")
        digits = "".join(char for char in label if char.isdigit())
        return (int(digits[-4:]) if len(digits) >= 4 else -1, label)
