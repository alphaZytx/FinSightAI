import asyncio
from pathlib import Path

from app.agents.base_agent import BaseAgent, AgentResult
from app.services.retrieval_service import RetrievalService
from app.services.citation_service import CitationService
from app.services.llm_service import LLMService

_RESEARCH_SYSTEM_PROMPT = (
    Path(__file__).resolve().parent.parent / "prompts" / "research_prompt.md"
)


def _load_system_prompt() -> str:
    try:
        return _RESEARCH_SYSTEM_PROMPT.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return (
            "You are the Research Agent for FinSightAI. "
            "Answer only using retrieved context. Cite every factual claim. "
            "If evidence is missing, say that the uploaded documents do not provide enough evidence."
        )


class ResearchAgent(BaseAgent):
    name = "ResearchAgent"
    description = "Answers research questions with strict source citations."

    def __init__(self) -> None:
        self.retriever = RetrievalService()
        self.citations = CitationService()
        self.llm = LLMService()

    async def run(self, state: dict) -> AgentResult:
        workspace_id = state["workspace_id"]
        question = state["question"]
        top_k = state.get("top_k", 8)
        chunks = await self.retriever.retrieve(workspace_id, question, top_k=top_k)
        cites = [self.citations.build_citation(chunk) for chunk in chunks]
        answer = await self._generate_answer(question, chunks)
        return AgentResult(agent_name=self.name, status="success", output={"answer": answer, "citations": cites})

    async def _generate_answer(self, question: str, chunks: list[dict]) -> str:
        if not chunks:
            return (
                "I could not find source evidence in the indexed workspace for this question. "
                "Upload and ingest relevant documents, then ask again."
            )

        # Try LLM-powered grounded answer
        system_prompt = _load_system_prompt()
        llm_answer = await asyncio.to_thread(
            self.llm.complete_with_context,
            system_prompt,
            question,
            chunks[:6],
            max_tokens=2048,
        )
        if llm_answer:
            return llm_answer

        # Fallback: deterministic concatenation
        return self._compose_grounded_answer(question, chunks)

    def _compose_grounded_answer(self, question: str, chunks: list[dict]) -> str:
        """Deterministic fallback when LLM is unavailable."""
        lines = [f"Grounded answer for: {question}", ""]
        for idx, chunk in enumerate(chunks[:4], start=1):
            snippet = " ".join(chunk.get("text", "").split())[:420]
            page = chunk.get("page_start", "unknown")
            lines.append(f"{idx}. Page {page}: {snippet}")
        lines.append("")
        lines.append("These points are extracted from the cited chunks only; use the citations to verify the wording in the source document.")
        return "\n".join(lines)