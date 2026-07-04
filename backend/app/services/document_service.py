from pathlib import Path
from re import sub
from uuid import uuid4

from fastapi import HTTPException, UploadFile

from app.core.config import settings
from app.repositories.document_repository import DocumentRepository
from app.orchestration.workflow import AgentWorkflow

MAX_UPLOAD_BYTES = 50 * 1024 * 1024


class DocumentService:
    def __init__(self) -> None:
        self.repo = DocumentRepository()
        self.workflow = AgentWorkflow()

    async def upload_document(
        self,
        workspace_id: str,
        company_name: str,
        fiscal_year: str,
        document_type: str,
        file: UploadFile,
        auto_ingest: bool = False,
    ) -> dict:
        original_name = file.filename or "document.pdf"
        if Path(original_name).suffix.lower() != ".pdf":
            raise HTTPException(status_code=400, detail="Only PDF uploads are supported.")

        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded PDF is empty.")
        if len(content) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=413, detail="PDF exceeds the 50 MB upload limit.")
        if b"%PDF" not in content[:1024]:
            raise HTTPException(status_code=400, detail="Uploaded file does not look like a valid PDF.")

        upload_dir = Path(settings.UPLOAD_DIR) / workspace_id
        upload_dir.mkdir(parents=True, exist_ok=True)
        safe_stem = sub(r"[^A-Za-z0-9_.-]+", "_", Path(original_name).stem).strip("._") or "document"
        stored_name = f"{safe_stem}_{uuid4().hex[:10]}.pdf"
        path = upload_dir / stored_name
        path.write_bytes(content)

        record = await self.repo.create({
            "workspace_id": workspace_id,
            "company_name": company_name.strip(),
            "fiscal_year": fiscal_year.strip(),
            "document_type": document_type,
            "file_name": original_name,
            "stored_file_name": stored_name,
            "file_path": str(path),
            "file_size_bytes": len(content),
            "status": "uploaded",
        })

        if auto_ingest:
            ingestion_result = await self.ingest_document(record["_id"])
            record["ingestion_result"] = ingestion_result
            record["status"] = "indexed" if ingestion_result.get("results", {}).get("document", {}).get("status") == "success" else "uploaded"
        return record

    async def ingest_document(self, document_id: str) -> dict:
        return await self.workflow.run_document_pipeline(document_id)