import hashlib
import re

import numpy as np


_TOKEN_PATTERN = re.compile(r"[a-zA-Z][a-zA-Z0-9_-]{1,}")


class EmbeddingService:
    """Deterministic lexical-semantic hashing embeddings for the local MVP.

    They are not a substitute for a trained financial embedding model, but unlike
    random whole-document vectors they preserve token and phrase overlap, which
    makes local retrieval explainable and useful without an API key.
    """

    def embed_text(self, text: str, dim: int = 384) -> list[float]:
        tokens = [token.lower() for token in _TOKEN_PATTERN.findall(text)]
        features = tokens + [f"{tokens[index]}_{tokens[index + 1]}" for index in range(len(tokens) - 1)]
        vector = np.zeros(dim, dtype=float)
        for feature in features:
            digest = hashlib.blake2b(feature.encode("utf-8"), digest_size=8).digest()
            value = int.from_bytes(digest, "little")
            index = value % dim
            sign = 1.0 if (value >> 63) == 0 else -1.0
            vector[index] += sign
        norm = np.linalg.norm(vector)
        if norm:
            vector /= norm
        return vector.astype(float).tolist()

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self.embed_text(text) for text in texts]
