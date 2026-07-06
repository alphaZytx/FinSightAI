from collections import Counter

from app.repositories.document_repository import DocumentRepository
from app.repositories.metric_repository import MetricRepository
from app.repositories.red_flag_repository import RedFlagRepository


_SEVERITY_ORDER = {"critical": 4, "high": 3, "medium": 2, "low": 1}
_METRIC_PRIORITY = {"revenue": 1, "ebitda": 2, "net_income": 3, "gross_margin": 4, "operating_margin": 5, "net_margin": 6, "total_debt": 7, "cash": 8, "current_ratio": 9, "debt_to_ebitda": 10}


class WorkspaceAnalysisService:
    """Returns a presentation-ready, source-preserving workspace snapshot."""

    def __init__(self) -> None:
        self.documents = DocumentRepository()
        self.metrics = MetricRepository()
        self.red_flags = RedFlagRepository()

    async def get_analysis(self, workspace_id: str) -> dict:
        documents, metrics, red_flags = await self._load_workspace_data(workspace_id)
        companies = sorted({item.get("company_name", "Unknown company") for item in documents})
        severity_counts = Counter(str(item.get("severity", "low")).lower() for item in red_flags)
        indexed_documents = sum(item.get("status") == "indexed" for item in documents)
        return {
            "workspace_id": workspace_id,
            "summary": {
                "document_count": len(documents),
                "indexed_document_count": indexed_documents,
                "company_count": len(companies),
                "companies": companies,
                "metric_count": len(metrics),
                "red_flag_count": len(red_flags),
                "high_priority_flag_count": severity_counts["critical"] + severity_counts["high"],
                "severity_counts": {level: severity_counts[level] for level in ("critical", "high", "medium", "low")},
                "pipeline_ready": indexed_documents > 0,
            },
            "documents": [self._document_view(item) for item in documents],
            "metrics": [self._metric_view(item) for item in self._prioritize_metrics(metrics)[:80]],
            "red_flags": [self._flag_view(item) for item in self._prioritize_flags(red_flags)[:24]],
        }

    async def _load_workspace_data(self, workspace_id: str) -> tuple[list[dict], list[dict], list[dict]]:
        documents = await self.documents.find_by_workspace(workspace_id)
        metrics = await self.metrics.find_by_workspace(workspace_id, limit=1000)
        red_flags = await self.red_flags.find_by_workspace(workspace_id, limit=1000)
        return documents, metrics, red_flags

    def _document_view(self, item: dict) -> dict:
        return {
            "_id": item.get("_id"),
            "company_name": item.get("company_name"),
            "fiscal_year": item.get("fiscal_year"),
            "document_type": item.get("document_type"),
            "file_name": item.get("file_name"),
            "status": item.get("status"),
        }

    def _metric_view(self, item: dict) -> dict:
        return {
            "_id": item.get("_id"),
            "company_name": item.get("company_name"),
            "metric_name": item.get("metric_name"),
            "display_name": item.get("display_name"),
            "value": item.get("value"),
            "normalized_value": item.get("normalized_value", item.get("value")),
            "unit": item.get("unit"),
            "period": item.get("period"),
            "source_page": item.get("source_page"),
            "document_id": item.get("document_id"),
            "evidence": item.get("evidence"),
            "confidence": item.get("confidence"),
            "extraction_method": item.get("extraction_method"),
        }

    def _flag_view(self, item: dict) -> dict:
        return {
            "_id": item.get("_id"),
            "company_name": item.get("company_name"),
            "category": item.get("category"),
            "severity": item.get("severity"),
            "title": item.get("title"),
            "explanation": item.get("explanation"),
            "source_page": item.get("source_page"),
            "document_id": item.get("document_id"),
            "evidence": item.get("evidence"),
            "confidence": item.get("confidence"),
            "detection_method": item.get("detection_method"),
        }

    def _prioritize_metrics(self, metrics: list[dict]) -> list[dict]:
        return sorted(
            metrics,
            key=lambda item: (
                _METRIC_PRIORITY.get(item.get("metric_name"), 99),
                item.get("company_name", ""),
                str(item.get("period") or ""),
                -(item.get("confidence") or 0),
            ),
        )

    def _prioritize_flags(self, flags: list[dict]) -> list[dict]:
        return sorted(
            flags,
            key=lambda item: (-_SEVERITY_ORDER.get(str(item.get("severity", "low")).lower(), 0), item.get("company_name", "")),
        )
