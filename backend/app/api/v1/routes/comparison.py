from fastapi import APIRouter
from app.agents.comparison_agent import ComparisonAgent

router = APIRouter()
agent = ComparisonAgent()


@router.post("/run")
async def run_comparison(payload: dict):
    return await agent.run(payload)
