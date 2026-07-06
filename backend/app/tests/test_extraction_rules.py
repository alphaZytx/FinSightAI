from app.agents.extraction_agent import ExtractionAgent


def test_extraction_skips_fiscal_year_when_selecting_value():
    agent = ExtractionAgent()
    value = agent._best_value_match("Total revenue FY2024 was 1,250 million.", "total revenue")

    assert value == (1250.0, 1_250_000_000.0, "million")


def test_extraction_derives_only_supported_ratios():
    agent = ExtractionAgent()
    document = {"_id": "doc_1", "workspace_id": "ws_1", "company_name": "Example Corp"}
    metrics = [
        {"metric_name": "revenue", "display_name": "Revenue", "normalized_value": 1_000, "value": 1_000, "period": "2024", "source_page": 10, "source_chunk_id": "chunk_1", "confidence": 0.9},
        {"metric_name": "net_income", "display_name": "Net Income", "normalized_value": 125, "value": 125, "period": "2024", "source_page": 11, "source_chunk_id": "chunk_2", "confidence": 0.8},
        {"metric_name": "current_assets", "display_name": "Current Assets", "normalized_value": 240, "value": 240, "period": "2024", "source_page": 12, "source_chunk_id": "chunk_3", "confidence": 0.8},
        {"metric_name": "current_liabilities", "display_name": "Current Liabilities", "normalized_value": 120, "value": 120, "period": "2024", "source_page": 12, "source_chunk_id": "chunk_4", "confidence": 0.8},
    ]

    derived = {item["metric_name"]: item for item in agent._derive_ratios(document, metrics)}

    assert derived["net_margin"]["value"] == 12.5
    assert derived["net_margin"]["unit"] == "percent"
    assert derived["current_ratio"]["value"] == 2.0
    assert derived["current_ratio"]["unit"] == "x"
