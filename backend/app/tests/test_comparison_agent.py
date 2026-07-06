from app.agents.comparison_agent import ComparisonAgent


def test_comparison_uses_normalized_values_and_risk_scores():
    agent = ComparisonAgent()
    rows = agent._metric_rows([
        {"metric_name": "revenue", "display_name": "Revenue", "period": "2024", "company_name": "A", "value": 2, "normalized_value": 2_000_000, "unit": "million", "confidence": 0.9, "source_page": 8, "document_id": "doc_a"},
        {"metric_name": "revenue", "display_name": "Revenue", "period": "2024", "company_name": "B", "value": 1.5, "normalized_value": 1_500_000, "unit": "billion", "confidence": 0.8, "source_page": 9, "document_id": "doc_b"},
    ])
    risks = agent._risk_summary([
        {"company_name": "A", "severity": "critical", "title": "Audit concern"},
        {"company_name": "A", "severity": "medium", "title": "Liquidity pressure"},
    ])

    assert rows[0]["companies"]["A"]["normalized_value"] == 2_000_000
    assert "normalized" in rows[0]["normalization_note"].lower()
    assert risks[0]["risk_score"] == 6
    assert risks[0]["highest_severity"] == "critical"
