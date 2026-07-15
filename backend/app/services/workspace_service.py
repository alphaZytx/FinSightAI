import shutil
from pathlib import Path

from app.core.config import settings
from app.repositories.chunk_repository import ChunkRepository
from app.repositories.document_repository import DocumentRepository
from app.repositories.metric_repository import MetricRepository
from app.repositories.red_flag_repository import RedFlagRepository
from app.repositories.report_repository import ReportRepository


class WorkspaceService:
    def __init__(self) -> None:
        self.doc_repo = DocumentRepository()

    async def clear_workspace_data(self, workspace_id: str) -> dict:
        documents = await self.doc_repo.find_by_workspace(workspace_id, limit=10_000)

        for doc in documents:
            file_path = Path(doc.get("file_path", ""))
            if file_path.exists():
                file_path.unlink()

        chunks_deleted = await ChunkRepository().delete_by_workspace(workspace_id)
        metrics_deleted = await MetricRepository().delete_by_workspace(workspace_id)
        flags_deleted = await RedFlagRepository().delete_by_workspace(workspace_id)
        documents_deleted = await self.doc_repo.delete_by_workspace(workspace_id)
        reports_deleted = await ReportRepository().delete_by_workspace(workspace_id)

        upload_dir = Path(settings.UPLOAD_DIR) / workspace_id
        if upload_dir.exists():
            shutil.rmtree(upload_dir, ignore_errors=True)

        report_dir = Path(settings.REPORT_DIR) / workspace_id
        if report_dir.exists():
            shutil.rmtree(report_dir, ignore_errors=True)

        return {
            "cleared": True,
            "workspace_id": workspace_id,
            "documents_deleted": documents_deleted,
            "chunks_deleted": chunks_deleted,
            "metrics_deleted": metrics_deleted,
            "flags_deleted": flags_deleted,
            "reports_deleted": reports_deleted,
        }
