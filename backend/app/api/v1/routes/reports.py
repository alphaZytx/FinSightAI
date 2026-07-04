from fastapi import APIRouter
from app.agents.report_agent import ReportAgent

router = APIRouter()
agent = ReportAgent()


@router.post("/generate")
async def generate_report(payload: dict):
    return await agent.run(payload)
