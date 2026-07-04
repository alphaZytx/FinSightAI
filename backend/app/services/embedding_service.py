import hashlib
import numpy as np


class EmbeddingService:
    """Deterministic local embeddings for the MVP.
    """

    def embed_text(self, text: str, dim: int = 384) -> list[float]:
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        seed = int.from_bytes(digest[:4], "little")
        rng = np.random.default_rng(seed)
        vector = rng.normal(size=dim)
        vector = vector / max(np.linalg.norm(vector), 1e-9)
        return vector.astype(float).tolist()

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self.embed_text(text) for text in texts]
