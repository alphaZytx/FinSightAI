import asyncio
import re
from pathlib import Path

from app.agents.base_agent import AgentResult, BaseAgent
from app.repositories.metric_repository import MetricRepository
from app.repositories.red_flag_repository import RedFlagRepository
from app.services.citation_service import CitationService
from app.services.llm_service import LLMService
from app.services.retrieval_service import RetrievalService


_RESEARCH_SYSTEM_PROMPT = Path(__file__).resolve().parent.parent / "prompts" / "research_prompt.md"
_TOPIC_PATTERNS = {
    "revenue": ("revenue", "sales", "growth", "top line", "topline", "turnover"),
    "profitability": ("margin", "profit", "income", "ebitda", "earnings", "eps", "bottom line"),
    "leverage": ("debt", "borrowings", "leverage", "liquidity", "cash", "solvency", "current ratio"),
    "risk": ("risk", "red flag", "audit", "litigation", "going concern", "impairment", "writedown"),
    "cash flow": ("cash flow", "cashflow", "capex", "working capital", "free cash flow", "fcf", "operating cash"),
    "valuation": ("pe ratio", "price", "valuation", "book value", "market cap", "enterprise value"),
    "balance sheet": ("assets", "liabilities", "equity", "balance sheet", "inventory", "receivable", "payable"),
    "dividends": ("dividend", "payout", "buyback", "shareholder return", "yield"),
    "efficiency": ("roe", "roa", "roce", "return on", "asset turnover", "efficiency"),
}


def _load_system_prompt() -> str:
    try:
        return _RESEARCH_SYSTEM_PROMPT.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return (
            "You are a senior financial analyst. Answer only from retrieved source context. "
            "Cite every factual claim with the supplied source identifier [S1], [S2], etc. "
            "State when the evidence is insufficient. Be thorough and specific with numbers."
        )


class ResearchAgent(BaseAgent):
    name = "ResearchAgent"
    description = "Answers research questions through multi-step retrieval with strict citations."

    def __init__(self, llm_provider: str = "groq") -> None:
        self.retriever = RetrievalService()
        self.citations = CitationService()
        self.llm = LLMService(provider=llm_provider)
        self.metrics_repo = MetricRepository()
        self.red_flags_repo = RedFlagRepository()

    async def run(self, state: dict) -> AgentResult:
        workspace_id = state.get("workspace_id")
        question = str(state.get("question") or "").strip()
        if not workspace_id or not question:
            return AgentResult(agent_name=self.name, status="failed", errors=["workspace_id and question are required"])

        top_k = min(max(int(state.get("top_k", 12)), 1), 20)

        # Step 1: Decompose question into enriched sub-queries
        subquestions = self._decompose_question(question)

        # Step 2: Retrieve relevant chunks
        chunks = await self.retriever.retrieve_many(workspace_id, subquestions, top_k=top_k)

        # Step 3: Fetch saved metrics & red flags for structured context enrichment
        metrics, red_flags = await asyncio.gather(
            self.metrics_repo.find_by_workspace(workspace_id, limit=200),
            self.red_flags_repo.find_by_workspace(workspace_id, limit=50),
        )

        # Step 4: Build citations
        citations = [self.citations.build_citation(chunk, f"S{index}") for index, chunk in enumerate(chunks, 1)]

        # Step 5: Generate comprehensive answer
        answer = await self._generate_answer(question, subquestions, chunks, metrics, red_flags)

        return AgentResult(
            agent_name=self.name,
            status="success",
            output={
                "answer": answer,
                "citations": citations,
                "research_steps": {
                    "question_breakdown": subquestions,
                    "evidence_count": len(chunks),
                    "metrics_available": len(metrics),
                    "red_flags_available": len(red_flags),
                    "citation_policy": "Every factual claim must reference an S-number source.",
                },
            },
        )

    def _decompose_question(self, question: str) -> list[str]:
        """Break a complex question into focused sub-queries for better retrieval."""
        lowered = question.lower()
        focused = [topic for topic, keywords in _TOPIC_PATTERNS.items() if any(keyword in lowered for keyword in keywords)]

        queries = [question]

        # Add topic-enriched queries
        for topic in focused[:4]:
            queries.append(f"{topic} {question}")

        # If the question is compound (contains 'and', 'or', commas), split it
        if any(sep in lowered for sep in [" and ", ", ", " or ", " vs "]):
            parts = re.split(r'\band\b|,|\bor\b|\bvs\b', question, flags=re.IGNORECASE)
            for part in parts:
                part = part.strip()
                if len(part) > 10:
                    queries.append(part)

        # Add financial-term enriched query if no topic matched
        if not focused:
            queries.append(f"financial performance {question}")
            queries.append(f"key metrics {question}")

        return list(dict.fromkeys(queries))[:8]

    async def _generate_answer(self, question: str, subquestions: list[str], chunks: list[dict],
                                metrics: list[dict], red_flags: list[dict]) -> str:
        if not chunks:
            return (
                "The indexed workspace does not provide enough source evidence to answer this question. "
                "Upload and ingest relevant filings, then ask again."
            )

        system_prompt = _load_system_prompt()

        # Build rich source context from retrieved chunks
        source_context = []
        for index, chunk in enumerate(chunks[:12], 1):
            text = " ".join(chunk.get("text", "").split())[:1200]
            page = chunk.get("page_start", "?")
            score = chunk.get("score", 0)
            source_context.append(f"[S{index} | Page {page} | Relevance: {score:.0%}]\n{text}")

        # Build structured financial data context from saved metrics
        metrics_context = self._build_metrics_context(metrics, question)
        flags_context = self._build_flags_context(red_flags, question)

        user_prompt = (
            "### Question\n"
            f"{question}\n\n"
            "### Retrieval Focus\n"
            + "\n".join(f"- {item}" for item in subquestions)
            + "\n\n### Source Document Context\n"
            + "\n\n".join(source_context)
        )

        if metrics_context:
            user_prompt += f"\n\n### Extracted Financial Metrics (from prior analysis)\n{metrics_context}"

        if flags_context:
            user_prompt += f"\n\n### Detected Risk Signals (from prior analysis)\n{flags_context}"

        user_prompt += (
            "\n\n---\n"
            "Write a comprehensive, analyst-grade answer to the question above. Requirements:\n"
            "1. Use ONLY the source context and extracted data provided above\n"
            "2. Every factual sentence MUST include at least one citation [S1], [S2], etc.\n"
            "3. Include specific numbers, percentages, and time periods\n"
            "4. Structure your answer with markdown headers and bullet points\n"
            "5. End with a **Key Takeaways** section with 3-5 bullet points\n"
            "6. If evidence is partial or insufficient, state clearly what is missing\n"
        )

        llm_answer = await asyncio.to_thread(self.llm.complete, system_prompt, user_prompt, max_tokens=4096)
        if llm_answer and re.search(r"\[S\d+\]", llm_answer):
            return llm_answer.strip()
        return self._compose_grounded_answer(question, chunks, metrics)

    def _build_metrics_context(self, metrics: list[dict], question: str) -> str:
        """Build a structured metrics summary relevant to the question."""
        if not metrics:
            return ""

        lowered = question.lower()
        relevant_metrics = []

        # Filter metrics relevant to the question topics
        relevant_topics = set()
        for topic, keywords in _TOPIC_PATTERNS.items():
            if any(kw in lowered for kw in keywords):
                relevant_topics.add(topic)

        for metric in metrics:
            name = metric.get("metric_name", "").lower()
            # Include if relevant to question topics, or if no specific topic detected (include top metrics)
            if relevant_topics:
                is_relevant = any(
                    kw in name
                    for topic in relevant_topics
                    for kw in _TOPIC_PATTERNS.get(topic, ())
                )
                if not is_relevant:
                    continue
            relevant_metrics.append(metric)

        if not relevant_metrics:
            # Fall back to showing the most important metrics
            relevant_metrics = metrics[:20]
        else:
            relevant_metrics = relevant_metrics[:30]

        lines = []
        for m in relevant_metrics:
            value = m.get("value")
            if value is None:
                continue
            unit = m.get("unit", "")
            display = m.get("display_name") or m.get("metric_name", "unknown")
            company = m.get("company_name", "")
            period = m.get("period", "")
            confidence = m.get("confidence", 0)

            formatted_value = self._format_metric_value(value, unit)
            lines.append(f"- {company}: {display} = {formatted_value} ({period}) [confidence: {confidence:.0%}]")

        return "\n".join(lines)

    def _build_flags_context(self, red_flags: list[dict], question: str) -> str:
        """Build risk signals context."""
        if not red_flags:
            return ""

        lines = []
        for flag in red_flags[:10]:
            severity = flag.get("severity", "medium")
            title = flag.get("title", "")
            explanation = flag.get("explanation", "")
            company = flag.get("company_name", "")
            lines.append(f"- [{severity.upper()}] {company}: {title} — {explanation[:200]}")

        return "\n".join(lines)

    def _format_metric_value(self, value, unit: str) -> str:
        try:
            number = float(value)
        except (TypeError, ValueError):
            return str(value)
        if unit == "percent":
            return f"{number:,.2f}%"
        if unit == "x":
            return f"{number:,.2f}x"
        return f"{number:,.2f}{f' {unit}' if unit else ''}"

    def _compose_grounded_answer(self, question: str, chunks: list[dict], metrics: list[dict]) -> str:
        lines = [f"## Evidence for: {question}", ""]

        # Include relevant chunks
        for index, chunk in enumerate(chunks[:6], 1):
            snippet = " ".join(chunk.get("text", "").split())[:500]
            page = chunk.get("page_start", "?")
            lines.append(f"**Source S{index}** (Page {page}):")
            lines.append(f"{snippet}")
            lines.append("")

        # Include relevant metrics if available
        if metrics:
            lines.append("## Extracted Metrics")
            for m in metrics[:10]:
                value = m.get("value")
                if value is None:
                    continue
                display = m.get("display_name") or m.get("metric_name", "")
                company = m.get("company_name", "")
                period = m.get("period", "")
                formatted = self._format_metric_value(value, m.get("unit", ""))
                lines.append(f"- **{company}**: {display} = **{formatted}** ({period})")
            lines.append("")

        lines.extend([
            "---",
            "*The response above contains source extracts and extracted metrics rather than an unsupported synthesis. "
            "Review the linked citations before drawing final conclusions.*",
        ])
        return "\n".join(lines)
