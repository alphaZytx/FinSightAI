from fastapi import APIRouter, UploadFile, File, Form
from app.services.document_service import DocumentService

router = APIRouter()
service = DocumentService()


@router.post("/upload")
async def upload_document(
    workspace_id: str = Form(...),
    company_name: str = Form(...),
    fiscal_year: str = Form(...),
    document_type: str = Form("annual_report"),
    auto_ingest: bool = Form(False),
    file: UploadFile = File(...),
):
    return await service.upload_document(
        workspace_id=workspace_id,
        company_name=company_name,
        fiscal_year=fiscal_year,
        document_type=document_type,
        file=file,
        auto_ingest=auto_ingest,
    )


@router.post("/{document_id}/ingest")
async def ingest_document(document_id: str):
    return await service.ingest_document(document_id)