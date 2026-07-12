from pydantic import BaseModel


class ResearchQuestion(BaseModel):
    workspace_id: str
    session_id: str | None = None
    question: str
    top_k: int = 8
    llm_provider: str = "groq"
