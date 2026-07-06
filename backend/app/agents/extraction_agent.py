import asyncio
import json
import re
from collections import defaultdict
from pathlib import Path
from uuid import uuid4

from app.agents.base_agent import AgentResult, BaseAgent
from app.repositories.chunk_repository import ChunkRepository
from app.repositories.document_repository import DocumentRepository
from app.repositories.metric_repository import MetricRepository
from app.services.llm_service import LLMService
from app.utils.finance_units import normalize_unit


# Aliases intentionally favour unambiguous terms used in annual reports. Derived
# ratios are added only when their documented component metrics are available.
METRIC_ALIASES = {
    "revenue": ["total revenue", "net revenue", "net sales", "revenue", "sales"],
    "gross_profit": ["gross profit"],
    "ebitda": ["adjusted ebitda", "ebitda"],
    "operating_income": ["operating income", "income from operations", "operating profit"],
    "net_income": ["net income", "profit after tax", "profit attributable", "net profit"],
    "gross_margin": ["gross margin"],
    "operating_margin": ["operating margin"],
    "total_debt": ["total debt", "total borrowings", "borrowings", "debt"],
    "cash": ["cash and cash equivalents", "cash equivalents", "cash and bank balances"],
    "total_assets": ["total assets"],
    "total_liabilities": ["total liabilities"],
    "total_equity": ["total equity", "shareholders' equity", "stockholders' equity"],
    "current_assets": ["total current assets", "current assets"],
    "current_liabilities": ["total current liabilities", "current liabilities"],
    "operating_cash_flow": ["net cash from operating activities", "cash flow from operating activities", "operating cash flow"],
    "free_cash_flow": ["free cash flow"],
    "capex": ["capital expenditures", "capital expenditure", "capex"],
    "inventory": ["inventories", "inventory"],
    "accounts_receivable": ["accounts receivable", "trade receivables", "receivables"],
    "eps": ["diluted eps", "basic eps", "earnings per share", "eps"],
    "interest_expense": ["interest expense", "finance costs"],
}

VALUE_PATTERN = re.compile(
    r"(?<![A-Za-z0-9])(?P<currency>[$Ã¢â€šÂ¹Ã¢â€šÂ¬Ã‚Â£]|USD|INR|EUR|GBP)?\s*"
    r"(?P<value>\(?-?\d[\d,]*(?:\.\d+)?\)?)(?:\s*"
    r"(?P<unit>%|percent|thousand|million|billion|crore|lakh|lakhs|m|bn))?",
    re.IGNORECASE,
)
PERIOD_PATTERN = re.compile(r"\b(?:FY\s*)?(20\d{2})\b", re.IGNORECASE)
UNIT_HINTS = ["thousand", "million", "billion", "crore", "lakh", "lakhs"]

_EXTRACTION_SYSTEM_PROMPT = Path(__file__).resolve().parent.parent / "prompts" / "extraction_prompt.md"


def _load_extraction_prompt() -> str:
    try:
        return _EXTRACTION_SYSTEM_PROMPT.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return (
            "You are the Extraction Agent for FinSightAI. Extract only financial metrics "
            "present in the supplied source chunks. Return a valid JSON array with metric_name, "
            "value, unit, period, source_page and confidence."
        )


class ExtractionAgent(BaseAgent):
    name = "ExtractionAgent"
    description = "Extracts citable financial metrics and derives evidence-backed ratios."

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
        extracted = self._extract_metrics(document, chunks)
        llm_extras = await self._llm_extract(document, chunks, extracted)
        existing_keys = {(item["metric_name"], item.get("period")) for item in extracted}
        for extra in llm_extras:
            key = (extra["metric_name"], extra.get("period"))
            if key not in existing_keys:
                extracted.append(extra)
                existing_keys.add(key)

        derived = self._derive_ratios(document, extracted)
        extracted.extend(derived)

        await self.metrics.delete_by_document(document_id)
        inserted = await self.metrics.insert_many(extracted)
        return AgentResult(
            agent_name=self.name,
            status="success",
            output={
                "metrics": extracted,
                "metrics_saved": inserted,
                "derived_ratio_count": len(derived),
                "coverage": self._coverage_summary(extracted),
            },
        )

    async def _llm_extract(self, document: dict, chunks: list[dict], existing: list[dict]) -> list[dict]:
        """Request a conservative second pass and keep only supplied source pages."""
        if not chunks:
            return []

        sample_chunks = chunks[:8]
        source_chunks = {chunk.get("page_start"): chunk for chunk in sample_chunks}
        context_parts = []
        for index, chunk in enumerate(sample_chunks, 1):
            text = " ".join(chunk.get("text", "").split())[:650]
            context_parts.append(f"[Chunk {index} | Page {chunk.get('page_start', '?')}]\n{text}")

        existing_names = [item["metric_name"] for item in existing[:14]]
        prompt = (
            f"Company: {document.get('company_name', 'Unknown')}\n"
            f"Fiscal year: {document.get('fiscal_year', 'Unknown')}\n"
            f"Existing metrics: {', '.join(existing_names) or 'none'}\n\n"
            "Extract only additional metrics that are explicitly stated in the chunks below. "
            "A source_page must match a supplied page; do not infer values or periods. "
            "Return [] if nothing additional is reliable.\n\n"
            + "\n\n".join(context_parts)
        )
        raw = await asyncio.to_thread(self.llm.complete, _load_extraction_prompt(), prompt, max_tokens=1500)
        if not raw:
            return []
        return self._parse_llm_metrics(raw, document, source_chunks)

    def _parse_llm_metrics(self, raw: str, document: dict, source_chunks: dict[int, dict]) -> list[dict]:
        metrics: list[dict] = []
        match = re.search(r"\[.*\]", raw, re.DOTALL)
        if not match:
            return metrics
        try:
            items = json.loads(match.group())
        except json.JSONDecodeError:
            return metrics
        if not isinstance(items, list):
            return metrics

        for item in items[:20]:
            if not isinstance(item, dict):
                continue
            metric_name = re.sub(r"[^a-z0-9]+", "_", str(item.get("metric_name", "")).lower()).strip("_")
            page = self._as_page(item.get("source_page"))
            chunk = source_chunks.get(page)
            raw_value = self._parse_number(str(item.get("value", "")))
            if not metric_name or raw_value is None or not chunk:
                continue
            unit = self._normalize_unit(str(item.get("unit", "")) or None, chunk.get("text", ""))
            metrics.append(
                self._metric_record(
                    document=document,
                    metric_name=metric_name,
                    value=raw_value,
                    unit=unit,
                    period=str(item.get("period", "")) or document.get("fiscal_year"),
                    chunk=chunk,
                    evidence=" ".join(chunk.get("text", "").split())[:500],
                    confidence=min(self._as_confidence(item.get("confidence")), 0.60),
                    extraction_method="llm_review",
                )
            )
        return metrics

    def _extract_metrics(self, document: dict, chunks: list[dict]) -> list[dict]:
        metrics: list[dict] = []
        seen: set[tuple[str, str | None, str]] = set()
        for chunk in chunks:
            lines = [" ".join(line.split()) for line in chunk.get("text", "").splitlines()]
            for line in lines:
                if not line:
                    continue
                lowered = line.lower()
                for metric_name, aliases in METRIC_ALIASES.items():
                    alias = next((candidate for candidate in aliases if candidate in lowered), None)
                    if not alias:
                        continue
                    extracted_value = self._best_value_match(line, alias)
                    if not extracted_value:
                        continue
                    value, normalized_value, unit = extracted_value
                    metric_name = self._classify_metric_name(metric_name, unit, line)
                    period = self._extract_period(line) or document.get("fiscal_year")
                    key = (metric_name, period, chunk["_id"])
                    if key in seen:
                        continue
                    seen.add(key)
                    metrics.append(
                        self._metric_record(
                            document=document,
                            metric_name=metric_name,
                            value=value,
                            normalized_value=normalized_value,
                            unit=unit,
                            period=period,
                            chunk=chunk,
                            evidence=line[:500],
                            confidence=0.76 if alias == aliases[0] else 0.66,
                            extraction_method="rule_based",
                        )
                    )
                    break
        return metrics[:100]

    def _classify_metric_name(self, metric_name: str, unit: str | None, line: str) -> str:
        lowered = line.lower()
        if metric_name == "revenue" and unit == "percent":
            growth_terms = ("growth", "grew", "increased", "increase", "declined", "decreased", "decrease")
            if any(term in lowered for term in growth_terms):
                return "revenue_growth"
        return metric_name
    def _best_value_match(self, line: str, alias: str) -> tuple[float, float, str | None] | None:
        alias_index = line.lower().find(alias)
        candidates: list[tuple[bool, int, float, str | None]] = []
        for match in VALUE_PATTERN.finditer(line):
            parsed = self._parse_number(match.group("value"))
            if parsed is None or self._is_year_value(parsed):
                continue
            unit = self._normalize_unit(match.group("unit"), line)
            is_after_alias = match.start() >= alias_index + len(alias)
            distance = abs(match.start() - alias_index)
            candidates.append((is_after_alias, distance, parsed, unit))

        if not candidates:
            return None
        candidates.sort(key=lambda item: (not item[0], item[1]))
        _, _, value, unit = candidates[0]
        normalized_value = value if unit in {None, "percent", "x"} else normalize_unit(value, unit)
        return value, normalized_value, unit

    def _derive_ratios(self, document: dict, metrics: list[dict]) -> list[dict]:
        """Calculate ratios only from directly extracted values in the same filing period."""
        by_period: dict[str | None, dict[str, dict]] = defaultdict(dict)
        for metric in sorted(metrics, key=lambda item: item.get("confidence", 0), reverse=True):
            by_period[metric.get("period")].setdefault(metric["metric_name"], metric)

        derived: list[dict] = []
        for period, values in by_period.items():
            derived.extend(self._ratio_candidates(document, period, values))
        return derived

    def _ratio_candidates(self, document: dict, period: str | None, values: dict[str, dict]) -> list[dict]:
        candidates = [
            ("gross_margin", "Gross Margin", "gross_profit", "revenue", "percent", lambda left, right: left / right * 100),
            ("operating_margin", "Operating Margin", "operating_income", "revenue", "percent", lambda left, right: left / right * 100),
            ("net_margin", "Net Margin", "net_income", "revenue", "percent", lambda left, right: left / right * 100),
            ("current_ratio", "Current Ratio", "current_assets", "current_liabilities", "x", lambda left, right: left / right),
            ("debt_to_equity", "Debt to Equity", "total_debt", "total_equity", "x", lambda left, right: left / right),
            ("debt_to_ebitda", "Debt to EBITDA", "total_debt", "ebitda", "x", lambda left, right: left / right),
            ("free_cash_flow", "Free Cash Flow", "operating_cash_flow", "capex", None, lambda left, right: left - abs(right)),
        ]
        derived: list[dict] = []
        for metric_name, display_name, numerator_name, denominator_name, unit, calculator in candidates:
            if metric_name in values or numerator_name not in values or denominator_name not in values:
                continue
            numerator, denominator = values[numerator_name], values[denominator_name]
            left = numerator.get("normalized_value", numerator.get("value"))
            right = denominator.get("normalized_value", denominator.get("value"))
            if left is None or right in {None, 0}:
                continue
            try:
                value = round(float(calculator(float(left), float(right))), 2)
            except (TypeError, ValueError, ZeroDivisionError):
                continue
            if unit == "percent" and not -1_000 <= value <= 1_000:
                continue
            source_pages = sorted({page for page in [numerator.get("source_page"), denominator.get("source_page")] if page is not None})
            derived.append(
                {
                    "_id": f"metric_{uuid4().hex[:12]}",
                    "workspace_id": document["workspace_id"],
                    "document_id": document["_id"],
                    "company_name": document.get("company_name", "Unknown company"),
                    "metric_name": metric_name,
                    "display_name": display_name,
                    "value": value,
                    "normalized_value": value,
                    "unit": unit,
                    "period": period,
                    "source_chunk_id": numerator.get("source_chunk_id", ""),
                    "source_page": numerator.get("source_page"),
                    "evidence": (
                        f"Calculated from {numerator.get('display_name', numerator_name)} and "
                        f"{denominator.get('display_name', denominator_name)}; source pages "
                        f"{', '.join(map(str, source_pages)) or 'not available'}."
                    ),
                    "confidence": round(min(numerator.get("confidence", 0.5), denominator.get("confidence", 0.5)) * 0.90, 2),
                    "extraction_method": "derived_ratio",
                }
            )
        return derived

    def _metric_record(
        self,
        *,
        document: dict,
        metric_name: str,
        value: float,
        unit: str | None,
        period: str | None,
        chunk: dict,
        evidence: str,
        confidence: float,
        extraction_method: str,
        normalized_value: float | None = None,
    ) -> dict:
        return {
            "_id": f"metric_{uuid4().hex[:12]}",
            "workspace_id": document["workspace_id"],
            "document_id": document["_id"],
            "company_name": document.get("company_name", "Unknown company"),
            "metric_name": metric_name,
            "display_name": metric_name.replace("_", " ").title(),
            "value": value,
            "normalized_value": normalized_value if normalized_value is not None else value,
            "unit": unit,
            "period": period,
            "source_chunk_id": chunk["_id"],
            "source_page": chunk.get("page_start"),
            "evidence": evidence,
            "confidence": round(max(0.0, min(confidence, 1.0)), 2),
            "extraction_method": extraction_method,
        }

    def _coverage_summary(self, metrics: list[dict]) -> dict:
        return {
            "metric_count": len(metrics),
            "reported_metric_count": sum(item.get("extraction_method") != "derived_ratio" for item in metrics),
            "derived_metric_count": sum(item.get("extraction_method") == "derived_ratio" for item in metrics),
            "high_confidence_count": sum(item.get("confidence", 0) >= 0.75 for item in metrics),
        }

    def _parse_number(self, value: str) -> float | None:
        cleaned = value.strip()
        negative = cleaned.startswith("(") and cleaned.endswith(")")
        cleaned = cleaned.replace(",", "").replace("(", "").replace(")", "").replace("$", "")
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

    def _is_year_value(self, value: float) -> bool:
        return value.is_integer() and 1900 <= value <= 2100

    def _as_page(self, value: object) -> int | None:
        try:
            return int(str(value))
        except (TypeError, ValueError):
            return None

    def _as_confidence(self, value: object) -> float:
        try:
            return max(0.0, min(float(value), 1.0))
        except (TypeError, ValueError):
            return 0.50
