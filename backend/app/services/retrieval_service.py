import numpy as np
from app.repositories.chunk_repository import ChunkRepository
from app.services.embedding_service import EmbeddingService


class RetrievalService:
    def __init__(self) -> None:
        self.chunk_repo = ChunkRepository()
        self.embedding_service = EmbeddingService()

    async def retrieve(self, workspace_id: str, query: str, top_k: int = 8) -> list[dict]:
        query_vec = np.array(self.embedding_service.embed_text(query))
        chunks = await self.chunk_repo.find_by_workspace(workspace_id, limit=2000)
        scored = []
        for chunk in chunks:
            emb = chunk.get("embedding")
            if not emb:
                continue
            vec = np.array(emb)
            score = float(np.dot(query_vec, vec) / (np.linalg.norm(query_vec) * np.linalg.norm(vec) + 1e-9))
            scored.append((score, chunk))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [{**chunk, "score": score} for score, chunk in scored[:top_k]]
