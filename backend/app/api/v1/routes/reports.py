from fastapi import APIRouter
from app.agents.report_agent import ReportAgent

router = APIRouter()


@router.post("/generate")
async def generate_report(payload: dict):
    llm_provider = payload.get("llm_provider", "groq")
    agent = ReportAgent(llm_provider=llm_provider)
    return await agent.run(payload)
