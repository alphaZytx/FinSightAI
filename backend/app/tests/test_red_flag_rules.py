from app.agents.red_flag_agent import RedFlagAgent


def metric(name: str, value: float, period: str, page: int) -> dict:
    return {
        "metric_name": name,
        "display_name": name.replace("_", " ").title(),
        "normalized_value": value,
        "value": value,
        "period": period,
        "source_page": page,
        "source_chunk_id": f"chunk_{page}",
        "evidence": f"{name} source evidence",
        "confidence": 0.85,
        "extraction_method": "rule_based",
    }


def test_red_flag_agent_detects_debt_and_margin_deterioration():
    document = {"_id": "doc_1", "workspace_id": "ws_1", "company_name": "Example Corp"}
    metrics = [
        metric("total_debt", 100, "2023", 10),
        metric("total_debt", 145, "2024", 11),
        metric("operating_margin", 18, "2023", 20),
        metric("operating_margin", 11, "2024", 21),
        metric("current_ratio", 0.8, "2024", 30),
    ]

    flags = RedFlagAgent()._detect_quantitative_flags(document, metrics)
    categories = {flag["category"] for flag in flags}
    titles = {flag["title"] for flag in flags}

    assert "leverage" in categories
    assert "liquidity" in categories
    assert "Debt increased materially" in titles
    assert "Operating margin declined" in titles
