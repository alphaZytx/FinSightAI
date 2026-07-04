from pydantic import BaseModel


class ChunkRecord(BaseModel):
    id: str
    workspace_id: str
    document_id: str
    page_start: int
    page_end: int
    text: str
    embedding: list[float] | None = None
