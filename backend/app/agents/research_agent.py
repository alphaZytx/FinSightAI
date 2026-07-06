import asyncio
import re
from pathlib import Path

from app.agents.base_agent import AgentResult, BaseAgent
from app.services.citation_service import CitationService
from app.services.llm_service import LLMService
from app.services.retrieval_service import RetrievalService


_RESEARCH_SYSTEM_PROMPT = Path(__file__).resolve().parent.parent / "prompts" / "research_prompt.md"
_TOPIC_PATTERNS = {
    "revenue": ("revenue", "sales", "growth"),
    "profitability": ("margin", "profit", "income", "ebitda", "earnings"),
    "leverage": ("debt", "borrowings", "leverage", "liquidity", "cash"),
    "risk": ("risk", "red flag", "audit", "litigation", "going concern"),
    "cash flow": ("cash flow", "cashflow", "capex", "working capital"),
}


def _load_system_prompt() -> str:
    try:
        return _RESEARCH_SYSTEM_PROMPT.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return (
            "Answer only from retrieved source context. Cite every factual claim with the supplied "
            "source identifier. State when the evidence is insufficient."
        )


class ResearchAgent(BaseAgent):
    name = "ResearchAgent"
    description = "Answers research questions through multi-step retrieval with strict citations."

    def __init__(self) -> None:
        self.retriever = RetrievalService()
        self.citations = CitationService()
        self.llm = LLMService()

    async def run(self, state: dict) -> AgentResult:
        workspace_id = state.get("workspace_id")
        question = str(state.get("question") or "").strip()
        if not workspace_id or not question:
            return AgentResult(agent_name=self.name, status="failed", errors=["workspace_id and question are required"])

        top_k = min(max(int(state.get("top_k", 8)), 1), 12)
        subquestions = self._decompose_question(question)
        chunks = await self.retriever.retrieve_many(workspace_id, subquestions, top_k=top_k)
        citations = [self.citations.build_citation(chunk, f"S{index}") for index, chunk in enumerate(chunks, 1)]
        answer = await self._generate_answer(question, subquestions, chunks)
        return AgentResult(
            agent_name=self.name,
            status="success",
            output={
                "answer": answer,
                "citations": citations,
                "research_steps": {
                    "question_breakdown": subquestions,
                    "evidence_count": len(chunks),
                    "citation_policy": "Every factual claim must reference an S-number source.",
                },
            },
        )

    def _decompose_question(self, question: str) -> list[str]:
        lowered = question.lower()
        focused = [topic for topic, keywords in _TOPIC_PATTERNS.items() if any(keyword in lowered for keyword in keywords)]
        queries = [question]
        for topic in focused[:3]:
            queries.append(f"{topic} {question}")
        return list(dict.fromkeys(queries))

    async def _generate_answer(self, question: str, subquestions: list[str], chunks: list[dict]) -> str:
        if not chunks:
            return (
                "The indexed workspace does not provide enough source evidence to answer this question. "
                "Upload and ingest relevant filings, then ask again."
            )

        system_prompt = _load_system_prompt()
        source_context = []
        for index, chunk in enumerate(chunks[:8], 1):
            text = " ".join(chunk.get("text", "").split())[:750]
            source_context.append(f"[S{index} | Page {chunk.get('page_start', '?')}]\n{text}")
        user_prompt = (
            "### Question\n"
            f"{question}\n\n"
            "### Retrieval focus\n"
            + "\n".join(f"- {item}" for item in subquestions)
            + "\n\n### Source context\n"
            + "\n\n".join(source_context)
            + "\n\nWrite a concise analyst answer using only these sources. Every factual sentence must include "
            "at least one citation in the form [S1]. If evidence is partial, state the uncertainty clearly."
        )
        llm_answer = await asyncio.to_thread(self.llm.complete, system_prompt, user_prompt, max_tokens=2048)
        if llm_answer and re.search(r"\[S\d+\]", llm_answer):
            return llm_answer.strip()
        return self._compose_grounded_answer(question, chunks)

    def _compose_grounded_answer(self, question: str, chunks: list[dict]) -> str:
        lines = [f"Evidence gathered for: {question}", ""]
        for index, chunk in enumerate(chunks[:4], 1):
            snippet = " ".join(chunk.get("text", "").split())[:420]
            lines.append(f"{snippet} [S{index}]")
        lines.extend(
            [
                "",
                "The response above is a source extract rather than an unsupported synthesis. Review the linked citations before drawing a final conclusion.",
            ]
        )
        return "\n".join(lines)
