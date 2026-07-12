from fastapi import APIRouter
from app.schemas.research import ResearchQuestion
from app.agents.research_agent import ResearchAgent

router = APIRouter()


@router.post("/chat")
async def chat(payload: ResearchQuestion):
    agent = ResearchAgent(llm_provider=payload.llm_provider)
    return await agent.run(payload.model_dump())
