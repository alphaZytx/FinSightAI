import math
import re

import numpy as np

from app.repositories.chunk_repository import ChunkRepository
from app.services.embedding_service import EmbeddingService


_TOKEN_PATTERN = re.compile(r"[a-zA-Z][a-zA-Z0-9_-]{1,}")
_STOP_WORDS = {"a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how", "in", "is", "of", "on", "or", "the", "to", "was", "what", "which", "with"}


class RetrievalService:
    def __init__(self) -> None:
        self.chunk_repo = ChunkRepository()
        self.embedding_service = EmbeddingService()

    async def retrieve(self, workspace_id: str, query: str, top_k: int = 8) -> list[dict]:
        query_vec = np.array(self.embedding_service.embed_text(query))
        query_terms = self._terms(query)
        chunks = await self.chunk_repo.find_by_workspace(workspace_id, limit=2000)
        scored = []
        for chunk in chunks:
            text = chunk.get("text", "")
            lexical = self._lexical_score(query_terms, text)
            vector = self._vector_score(query_vec, chunk.get("embedding"))
            # Lexical evidence dominates because it remains valid for documents
            # indexed before the upgraded hashed-embedding implementation.
            score = 0.80 * lexical + 0.20 * vector
            if score > 0:
                scored.append((score, lexical, vector, chunk))
        scored.sort(key=lambda item: (item[0], item[1]), reverse=True)
        return [
            {**chunk, "score": round(score, 4), "lexical_score": round(lexical, 4)}
            for score, lexical, _vector, chunk in scored[:top_k]
        ]

    async def retrieve_many(self, workspace_id: str, queries: list[str], top_k: int = 8) -> list[dict]:
        merged: dict[str, dict] = {}
        for query in queries:
            for chunk in await self.retrieve(workspace_id, query, top_k=top_k):
                chunk_id = chunk["_id"]
                existing = merged.get(chunk_id)
                if existing is None or chunk["score"] > existing["score"]:
                    merged[chunk_id] = chunk
        return sorted(merged.values(), key=lambda chunk: chunk["score"], reverse=True)[:top_k]

    def _terms(self, query: str) -> set[str]:
        return {token.lower() for token in _TOKEN_PATTERN.findall(query) if token.lower() not in _STOP_WORDS}

    def _lexical_score(self, query_terms: set[str], text: str) -> float:
        if not query_terms:
            return 0.0
        text_terms = set(token.lower() for token in _TOKEN_PATTERN.findall(text))
        overlap = len(query_terms & text_terms) / len(query_terms)
        phrase_bonus = 0.12 if len(query_terms) >= 2 and " ".join(sorted(query_terms)) in text.lower() else 0.0
        return min(overlap + phrase_bonus, 1.0)

    def _vector_score(self, query_vec: np.ndarray, embedding: object) -> float:
        if not embedding:
            return 0.0
        try:
            vector = np.array(embedding, dtype=float)
            if vector.shape != query_vec.shape:
                return 0.0
            cosine = float(np.dot(query_vec, vector) / (np.linalg.norm(query_vec) * np.linalg.norm(vector) + 1e-9))
            return max(0.0, (cosine + 1.0) / 2.0)
        except (TypeError, ValueError):
            return 0.0
