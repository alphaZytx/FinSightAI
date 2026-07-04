from fastapi import APIRouter
from app.orchestration.workflow import AgentWorkflow

router = APIRouter()
workflow = AgentWorkflow()


@router.post("/run/document/{document_id}")
async def run_document_pipeline(document_id: str):
    return await workflow.run_document_pipeline(document_id=document_id)
