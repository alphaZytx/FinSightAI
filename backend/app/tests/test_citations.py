from app.services.citation_service import CitationService


def test_build_citation():
    citation = CitationService().build_citation({"document_id": "doc", "page_start": 2, "_id": "chunk", "text": "sample"})
    assert citation["page"] == 2
    assert citation["chunk_id"] == "chunk"
