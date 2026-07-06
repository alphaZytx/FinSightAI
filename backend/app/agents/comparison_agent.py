from collections import defaultdict

from app.agents.base_agent import AgentResult, BaseAgent
from app.repositories.document_repository import DocumentRepository
from app.repositories.metric_repository import MetricRepository
from app.repositories.red_flag_repository import RedFlagRepository


SEVERITY_ORDER = {"critical": 4, "high": 3, "medium": 2, "low": 1}
LOWER_IS_BETTER = {"total_debt", "debt_to_equity", "debt_to_ebitda"}


class ComparisonAgent(BaseAgent):
    name = "ComparisonAgent"
    description = "Benchmarks selected, citable financial reports across distinct companies."

    def __init__(self) -> None:
        self.documents = DocumentRepository()
        self.metrics = MetricRepository()
        self.red_flags = RedFlagRepository()

    async def run(self, state: dict) -> AgentResult:
        workspace_id = state.get("workspace_id")
        if not workspace_id:
            return AgentResult(agent_name=self.name, status="failed", errors=["workspace_id is required"])

        available_documents = [
            document for document in await self.documents.find_by_workspace(workspace_id)
            if document.get("status") == "indexed"
        ]
        selected_document_ids = state.get("document_ids")
        selected_documents = self._select_documents(available_documents, selected_document_ids)
        eligibility = self._eligibility(available_documents, selected_documents)

        if not eligibility["ready"]:
            return AgentResult(
                agent_name=self.name,
                status="needs_more_data",
                output={
                    "comparison": [],
                    "benchmark_insights": [],
                    "risk_summary": [],
                    "coverage": self._coverage(selected_documents, [], [], len(available_documents)),
                    "eligibility": eligibility,
                },
            )

        document_ids = [document["_id"] for document in selected_documents]
        metrics = await self.metrics.find_by_document_ids(document_ids)
        red_flags = await self.red_flags.find_by_document_ids(document_ids)
        all_rows = self._metric_rows(metrics)
        comparable_rows = [row for row in all_rows if len(row["companies"]) >= 2]
        coverage = self._coverage(selected_documents, all_rows, red_flags, len(available_documents))
        coverage["comparable_metric_rows"] = len(comparable_rows)
        coverage["unmatched_metric_rows"] = len(all_rows) - len(comparable_rows)

        eligibility["message"] = (
            "Ready to compare the selected companies."
            if comparable_rows
            else "The selected filings are from distinct companies, but they do not yet share extracted metrics for the same fiscal period."
        )
        return AgentResult(
            agent_name=self.name,
            status="success",
            output={
                "comparison": comparable_rows,
                "benchmark_insights": self._benchmark_insights(comparable_rows),
                "risk_summary": self._risk_summary(red_flags),
                "coverage": coverage,
                "eligibility": eligibility,
            },
        )

    def _select_documents(self, available_documents: list[dict], document_ids: object) -> list[dict]:
        if document_ids is None:
            return available_documents
        if not isinstance(document_ids, list):
            return []
        selected = {str(document_id) for document_id in document_ids}
        return [document for document in available_documents if document.get("_id") in selected]

    def _eligibility(self, available_documents: list[dict], selected_documents: list[dict]) -> dict:
        companies = sorted({document.get("company_name", "Unknown company") for document in selected_documents})
        if not selected_documents:
            message = "Select at least one indexed filing for each company you want to compare."
        elif len(companies) < 2:
            message = "Upload and select an indexed filing for a second company before running a comparison."
        else:
            message = "Select reports from at least two companies to run the comparison."
        return {
            "ready": len(companies) >= 2,
            "message": message,
            "selected_document_ids": [document["_id"] for document in selected_documents],
            "selected_companies": companies,
            "available_document_count": len(available_documents),
            "selected_document_count": len(selected_documents),
        }

    def _coverage(self, selected_documents: list[dict], metric_rows: list[dict], red_flags: list[dict], available_document_count: int) -> dict:
        companies = sorted({document.get("company_name", "Unknown company") for document in selected_documents})
        return {
            "company_count": len(companies),
            "companies": companies,
            "selected_document_count": len(selected_documents),
            "available_document_count": available_document_count,
            "metric_rows": len(metric_rows),
            "comparable_metric_rows": sum(len(row.get("companies", {})) >= 2 for row in metric_rows),
            "red_flags_considered": len(red_flags),
        }

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
