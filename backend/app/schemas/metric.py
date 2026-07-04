from pydantic import BaseModel


class FinancialMetric(BaseModel):
    company_name: str
    metric_name: str
    value: float | None
    unit: str | None
    period: str | None
    source_chunk_id: str
    source_page: int
    confidence: float
