from app.agents.comparison_agent import ComparisonAgent


def test_comparison_requires_two_distinct_companies():
    agent = ComparisonAgent()
    documents = [
        {"_id": "doc_1", "company_name": "Alpha", "status": "indexed"},
        {"_id": "doc_2", "company_name": "Alpha", "status": "indexed"},
    ]

    eligibility = agent._eligibility(documents, [documents[0]])

    assert not eligibility["ready"]
    assert "second company" in eligibility["message"].lower()


def test_comparison_accepts_two_distinct_companies():
    agent = ComparisonAgent()
    selected = [
        {"_id": "doc_1", "company_name": "Alpha", "status": "indexed"},
        {"_id": "doc_2", "company_name": "Beta", "status": "indexed"},
    ]

    eligibility = agent._eligibility(selected, selected)

    assert eligibility["ready"]
    assert eligibility["selected_companies"] == ["Alpha", "Beta"]
