import asyncio
import json
import re
from pathlib import Path
from uuid import uuid4

from app.agents.base_agent import BaseAgent, AgentResult
from app.repositories.chunk_repository import ChunkRepository
from app.repositories.document_repository import DocumentRepository
from app.repositories.metric_repository import MetricRepository
from app.services.llm_service import LLMService
from app.utils.finance_units import normalize_unit


METRIC_ALIASES = {
    "revenue": ["revenue", "total revenue", "net sales", "sales"],
    "ebitda": ["ebitda", "adjusted ebitda"],
    "net_income": ["net income", "profit after tax", "profit attributable", "net profit"],
    "gross_margin": ["gross margin"],
    "operating_margin": ["operating margin"],
    "total_debt": ["total debt", "borrowings", "debt"],
    "cash": ["cash and cash equivalents", "cash equivalents", "cash"],
    "eps": ["diluted eps", "basic eps", "earnings per share", "eps"],
    "capex": ["capital expenditure", "capital expenditures", "capex"],
}

VALUE_PATTERN = re.compile(
    r"(?P<currency>[$])?\s*(?P<value>\(?-?\d[\d,]*(?:\.\d+)?\)?)(?:\s*(?P<unit>%|percent|thousand|million|billion|crore|lakh|lakhs|m|bn))?",
    re.IGNORECASE,
)
PERIOD_PATTERN = re.compile(r"\b(?:FY\s*)?(20\d{2})\b", re.IGNORECASE)
UNIT_HINTS = ["thousand", "million", "billion", "crore", "lakh", "lakhs"]

_EXTRACTION_SYSTEM_PROMPT = (
    Path(__file__).resolve().parent.parent / "prompts" / "extraction_prompt.md"
)


def _load_extraction_prompt() -> str:
    try:
        return _EXTRACTION_SYSTEM_PROMPT.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return (
            "You are the Extraction Agent for FinSightAI. "
            "Extract only financial metrics present in the provided source chunks. "
            "Return valid JSON array. Every item must include metric_name, value, unit, period, source_page, and confidence."
        )


class ExtractionAgent(BaseAgent):
    name = "ExtractionAgent"
    description = "Extracts financial metrics and ratios with citations."

    def __init__(self) -> None:
        self.documents = DocumentRepository()
        self.chunks = ChunkRepository()
        self.metrics = MetricRepository()
        self.llm = LLMService()

    async def run(self, state: dict) -> AgentResult:
        document_id = state.get("document_id")
        if not document_id:
            return AgentResult(agent_name=self.name, status="failed", errors=["document_id is required"])

        document = await self.documents.get_by_id(document_id)
        if not document:
            return AgentResult(agent_name=self.name, status="failed", errors=["Document not found"])

        chunks = await self.chunks.find_by_document(document_id)

        # Primary: regex-based extraction
        extracted = self._extract_metrics(document, chunks)

        # Enhancement: LLM pass to find metrics the regex missed
        llm_extras = await self._llm_extract(document, chunks, extracted)
        if llm_extras:
            existing_keys = {(m["metric_name"], m.get("period")) for m in extracted}
            for extra in llm_extras:
                key = (extra["metric_name"], extra.get("period"))
                if key not in existing_keys:
                    extracted.append(extra)
                    existing_keys.add(key)

        await self.metrics.delete_by_document(document_id)
        inserted = await self.metrics.insert_many(extracted)
        return AgentResult(
            agent_name=self.name,
            status="success",
            output={"metrics": extracted, "metrics_saved": inserted},
        )

    # ───────── LLM-enhanced extraction ─────────

    async def _llm_extract(self, document: dict, chunks: list[dict], existing: list[dict]) -> list[dict]:
        """Use the LLM to extract additional metrics from the most relevant chunks."""
        if not chunks:
            return []

        system_prompt = _load_extraction_prompt()
        # Send a sample of chunks (first 4 pages' worth) to keep tokens manageable
        sample_chunks = chunks[:8]
        context_parts = []
        for idx, chunk in enumerate(sample_chunks, 1):
            page = chunk.get("page_start", "?")
            text = " ".join(chunk.get("text", "").split())[:500]
            context_parts.append(f"[Chunk {idx} | Page {page}]\n{text}")

        existing_names = [m["metric_name"] for m in existing[:10]]
        user_prompt = (
            f"Company: {document.get('company_name', 'Unknown')}\n"
            f"Fiscal Year: {document.get('fiscal_year', 'Unknown')}\n\n"
            f"Already extracted metrics: {', '.join(existing_names) if existing_names else 'none yet'}\n\n"
            f"### Source chunks\n\n" + "\n\n".join(context_parts) + "\n\n"
            f"Extract any additional financial metrics NOT already listed above. "
            f"Return a JSON array of objects with keys: metric_name, value, unit, period, source_page, confidence. "
            f"If no additional metrics are found, return an empty array []."
        )

        raw = await asyncio.to_thread(
            self.llm.complete, system_prompt, user_prompt, max_tokens=1500
        )
        if not raw:
            return []

        return self._parse_llm_metrics(raw, document)

    def _parse_llm_metrics(self, raw: str, document: dict) -> list[dict]:
        """Safely parse LLM JSON output into metric dicts."""
        metrics = []
        try:
            # Try to find a JSON array in the response
            match = re.search(r"\[.*\]", raw, re.DOTALL)
            if not match:
                return []
            items = json.loads(match.group())
            if not isinstance(items, list):
                return []
            for item in items[:20]:
                if not isinstance(item, dict):
                    continue
                metric_name = str(item.get("metric_name", "")).strip().lower().replace(" ", "_")
                if not metric_name:
                    continue
                try:
                    value = float(item.get("value", 0))
                except (ValueError, TypeError):
                    continue
                metrics.append({
                    "_id": f"metric_{uuid4().hex[:12]}",
                    "workspace_id": document["workspace_id"],
                    "document_id": document["_id"],
                    "company_name": document.get("company_name", "Unknown company"),
                    "metric_name": metric_name,
                    "display_name": metric_name.replace("_", " ").title(),
                    "value": value,
                    "unit": str(item.get("unit", "")) or None,
                    "period": str(item.get("period", "")) or document.get("fiscal_year"),
                    "source_chunk_id": "llm_extracted",
                    "source_page": item.get("source_page"),
                    "evidence": f"LLM-extracted: {metric_name} = {value}",
                    "confidence": min(float(item.get("confidence", 0.55)), 0.85),
                })
        except (json.JSONDecodeError, TypeError, KeyError):
            pass
        return metrics

    # ───────── regex-based extraction (original) ─────────

    def _extract_metrics(self, document: dict, chunks: list[dict]) -> list[dict]:
        metrics: list[dict] = []
        seen: set[tuple[str, str | None, str]] = set()
        for chunk in chunks:
            for raw_line in chunk.get("text", "").splitlines():
                line = " ".join(raw_line.split())
                lowered = line.lower()
                if not line:
                    continue
                for metric_name, aliases in METRIC_ALIASES.items():
                    matched_alias = next((alias for alias in aliases if alias in lowered), None)
                    if not matched_alias:
                        continue
                    value_match = self._best_value_match(line, matched_alias)
                    if not value_match:
                        continue
                    value, unit = value_match
                    period = self._extract_period(line) or document.get("fiscal_year")
                    key = (metric_name, period, chunk["_id"])
                    if key in seen:
                        continue
                    seen.add(key)
                    metrics.append({
                        "_id": f"metric_{uuid4().hex[:12]}",
                        "workspace_id": document["workspace_id"],
                        "document_id": document["_id"],
                        "company_name": document.get("company_name", "Unknown company"),
                        "metric_name": metric_name,
                        "display_name": metric_name.replace("_", " ").title(),
                        "value": value,
                        "unit": unit,
                        "period": period,
                        "source_chunk_id": chunk["_id"],
                        "source_page": chunk.get("page_start"),
                        "evidence": line[:500],
                        "confidence": 0.72 if matched_alias == aliases[0] else 0.62,
                    })
                    break
        return metrics[:80]

    def _best_value_match(self, line: str, alias: str) -> tuple[float, str | None] | None:
        alias_index = line.lower().find(alias)
        matches = list(VALUE_PATTERN.finditer(line))
        if not matches:
            return None
        matches.sort(key=lambda match: abs(match.start() - alias_index))
        for match in matches[:3]:
            parsed = self._parse_number(match.group("value"))
            if parsed is None:
                continue
            unit = self._normalize_unit(match.group("unit"), line)
            if unit == "percent":
                return parsed, unit
            if unit in {"thousand", "million", "billion", "crore"}:
                return normalize_unit(parsed, unit), unit
            return parsed, unit
        return None

    def _parse_number(self, value: str) -> float | None:
        negative = value.startswith("(") and value.endswith(")")
        cleaned = value.replace(",", "").replace("(", "").replace(")", "")
        try:
            parsed = float(cleaned)
        except ValueError:
            return None
        return -parsed if negative else parsed

    def _normalize_unit(self, unit: str | None, line: str) -> str | None:
        if unit:
            lowered = unit.lower()
            if lowered in {"%", "percent"}:
                return "percent"
            if lowered == "m":
                return "million"
            if lowered == "bn":
                return "billion"
            if lowered in {"lakh", "lakhs"}:
                return "lakh"
            return lowered
        lowered_line = line.lower()
        for hint in UNIT_HINTS:
            if hint in lowered_line:
                return "lakh" if hint.startswith("lakh") else hint
        return None

    def _extract_period(self, line: str) -> str | None:
        match = PERIOD_PATTERN.search(line)
        return match.group(1) if match else None