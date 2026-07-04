from pydantic import BaseModel


class RedFlag(BaseModel):
    category: str
    severity: str
    title: str
    explanation: str
    source_chunk_id: str
    source_page: int
    confidence: float
