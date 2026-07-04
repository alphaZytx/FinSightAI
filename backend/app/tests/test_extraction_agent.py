import asyncio

from app.agents.extraction_agent import ExtractionAgent


def test_extraction_agent_requires_document_id():
    result = asyncio.run(ExtractionAgent().run({}))
    assert result.status == "failed"
    assert "document_id is required" in result.errors