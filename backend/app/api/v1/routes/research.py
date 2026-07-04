from fastapi import APIRouter
from app.schemas.research import ResearchQuestion
from app.agents.research_agent import ResearchAgent

router = APIRouter()
agent = ResearchAgent()


@router.post("/chat")
async def chat(payload: ResearchQuestion):
    return await agent.run(payload.model_dump())
