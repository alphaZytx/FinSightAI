from fastapi import APIRouter
from app.orchestration.workflow import AgentWorkflow

router = APIRouter()


@router.post("/run/document/{document_id}")
async def run_document_pipeline(document_id: str, llm_provider: str = "groq"):
    workflow = AgentWorkflow(llm_provider=llm_provider)
    return await workflow.run_document_pipeline(document_id=document_id)
