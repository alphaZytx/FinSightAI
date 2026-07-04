"""Groq LLM service for FinSightAI.

Provides a thin async wrapper around the Groq Python SDK so that agents
can call a single ``complete()`` method without caring about SDK details.
"""

from __future__ import annotations

import logging
from typing import Optional

from app.core.config import settings

logger = logging.getLogger("finsight-ai")

# ---------- lazy Groq client ----------

_groq_client = None


def _get_groq_client():
    global _groq_client
    if _groq_client is not None:
        return _groq_client
    try:
        from groq import Groq

        api_key = settings.GROQ_API_KEY
        if not api_key or api_key == "replace_me":
            api_key = settings.LLM_API_KEY
        if not api_key or api_key == "replace_me":
            logger.warning("No Groq API key configured – LLM calls will be skipped.")
            return None
        _groq_client = Groq(api_key=api_key)
        return _groq_client
    except Exception as exc:
        logger.warning("Could not initialise Groq client: %s", exc)
        return None


class LLMService:
    """Synchronous wrapper – Groq's SDK is sync, so we call it from
    ``asyncio.to_thread`` in async contexts when needed."""

    def __init__(self, model: Optional[str] = None):
        self.model = model or settings.GROQ_MODEL or "llama-3.3-70b-versatile"

    # ----- core completion -----

    def complete(
        self,
        system_prompt: str,
        user_prompt: str,
        *,
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ) -> Optional[str]:
        """Return an LLM completion, or ``None`` when the client is
        unavailable (missing key, SDK not installed, rate-limited, …)."""
        client = _get_groq_client()
        if client is None:
            return None
        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content
        except Exception as exc:
            logger.error("Groq completion failed: %s", exc)
            return None

    # ----- convenience -----

    def complete_with_context(
        self,
        system_prompt: str,
        question: str,
        context_chunks: list[dict],
        *,
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ) -> Optional[str]:
        """Build a RAG-style user prompt from *context_chunks* and call
        ``complete``."""
        context_parts: list[str] = []
        for idx, chunk in enumerate(context_chunks, start=1):
            page = chunk.get("page_start", "?")
            text = " ".join(chunk.get("text", "").split())[:600]
            context_parts.append(f"[Chunk {idx} | Page {page}]\n{text}")

        user_prompt = (
            f"### Source context\n\n"
            + "\n\n".join(context_parts)
            + f"\n\n### Question\n{question}"
        )
        return self.complete(
            system_prompt,
            user_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
        )
