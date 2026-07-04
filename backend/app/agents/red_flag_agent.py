import asyncio
from pathlib import Path
from uuid import uuid4

from app.agents.base_agent import BaseAgent, AgentResult
from app.repositories.chunk_repository import ChunkRepository
from app.repositories.document_repository import DocumentRepository
from app.repositories.red_flag_repository import RedFlagRepository
from app.services.llm_service import LLMService


RISK_RULES = [
    ("going_concern", "critical", "Going concern language", ["going concern", "substantial doubt"]),
    ("audit", "high", "Audit or control concern", ["material weakness", "qualified opinion", "adverse opinion"]),
    ("liquidity", "high", "Liquidity pressure", ["liquidity risk", "working capital deficit", "negative cash flow"]),
    ("leverage", "medium", "Debt or leverage risk", ["debt covenant", "high leverage", "borrowings increased", "debt increased"]),
    ("legal", "medium", "Legal or contingent liability", ["litigation", "contingent liability", "legal proceedings"]),
    ("related_party", "medium", "Related-party exposure", ["related party", "related-party"]),
    ("concentration", "medium", "Concentration risk", ["major customer", "customer concentration", "single customer"]),
    ("profitability", "medium", "Profitability pressure", ["margin declined", "decline in margin", "net loss"]),
]

_RED_FLAG_SYSTEM_PROMPT = (
    Path(__file__).resolve().parent.parent / "prompts" / "red_flag_prompt.md"
)


def _load_red_flag_prompt() -> str:
    try:
        return _RED_FLAG_SYSTEM_PROMPT.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return (
            "You are the Red Flag Agent for FinSightAI. "
            "Identify red flags using only the provided source evidence. "
            "Return a brief, analyst-quality explanation for each risk."
        )


class RedFlagAgent(BaseAgent):
    name = "RedFlagAgent"
    description = "Detects financial red flags and anomalies."

    def __init__(self) -> None:
        self.documents = DocumentRepository()
        self.chunks = ChunkRepository()
        self.red_flags = RedFlagRepository()
        self.llm = LLMService()

    async def run(self, state: dict) -> AgentResult:
        document_id = state.get("document_id")
        if not document_id:
            return AgentResult(agent_name=self.name, status="failed", errors=["document_id is required"])

        document = await self.documents.get_by_id(document_id)
        if not document:
            return AgentResult(agent_name=self.name, status="failed", errors=["Document not found"])

        chunks = await self.chunks.find_by_document(document_id)
        flags = self._detect_flags(document, chunks)

        # Enhance explanations with LLM
        flags = await self._enhance_explanations(flags)

        await self.red_flags.delete_by_document(document_id)
        inserted = await self.red_flags.insert_many(flags)
        return AgentResult(
            agent_name=self.name,
            status="success",
            output={"red_flags": flags, "red_flags_saved": inserted},
        )

    async def _enhance_explanations(self, flags: list[dict]) -> list[dict]:
        """Use the LLM to generate analyst-quality explanations for
        each detected red flag, replacing the generic template text."""
        if not flags:
            return flags

        system_prompt = _load_red_flag_prompt()
        flag_descriptions = []
        for idx, flag in enumerate(flags, 1):
            flag_descriptions.append(
                f"{idx}. Category: {flag['category']} | Severity: {flag['severity']} | "
                f"Title: {flag['title']}\n   Evidence: {flag.get('evidence', 'N/A')[:300]}"
            )

        user_prompt = (
            f"Company: {flags[0].get('company_name', 'Unknown')}\n\n"
            f"The following red flags were detected by keyword analysis. "
            f"For each one, write a brief (2–3 sentence) analyst-quality explanation "
            f"based ONLY on the provided evidence. Do NOT speculate beyond the evidence.\n\n"
            + "\n".join(flag_descriptions)
            + "\n\nReturn one explanation per line, numbered to match the flags above."
        )

        raw = await asyncio.to_thread(
            self.llm.complete, system_prompt, user_prompt, max_tokens=1200
        )
        if not raw:
            return flags

        # Parse numbered explanations
        lines = [line.strip() for line in raw.strip().splitlines() if line.strip()]
        for idx, flag in enumerate(flags):
            # Find the matching numbered line
            for line in lines:
                if line.startswith(f"{idx + 1}.") or line.startswith(f"{idx + 1})"):
                    # Strip the number prefix
                    explanation = line.split(".", 1)[-1].strip() if "." in line[:4] else line.split(")", 1)[-1].strip()
                    if len(explanation) > 20:
                        flag["explanation"] = explanation
                    break

        return flags

    def _detect_flags(self, document: dict, chunks: list[dict]) -> list[dict]:
        flags: list[dict] = []
        seen_categories: set[str] = set()
        for chunk in chunks:
            text = " ".join(chunk.get("text", "").split())
            lowered = text.lower()
            for category, severity, title, keywords in RISK_RULES:
                if category in seen_categories:
                    continue
                keyword = next((item for item in keywords if item in lowered), None)
                if not keyword:
                    continue
                seen_categories.add(category)
                snippet_start = max(lowered.find(keyword) - 120, 0)
                snippet = text[snippet_start:snippet_start + 360]
                flags.append({
                    "_id": f"flag_{uuid4().hex[:12]}",
                    "workspace_id": document["workspace_id"],
                    "document_id": document["_id"],
                    "company_name": document.get("company_name", "Unknown company"),
                    "category": category,
                    "severity": severity,
                    "title": title,
                    "explanation": f"Found source language related to '{keyword}'. Review the cited page before treating this as an analyst conclusion.",
                    "source_chunk_id": chunk["_id"],
                    "source_page": chunk.get("page_start"),
                    "evidence": snippet,
                    "confidence": 0.68,
                })
        return flags