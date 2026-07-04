from app.services.chunking_service import ChunkingService


def test_chunking_creates_chunks():
    service = ChunkingService()
    chunks = service.chunk_pages("ws_1", "doc_1", [{"page": 1, "text": "hello " * 500}], chunk_size=100)
    assert len(chunks) > 1
    assert chunks[0]["page_start"] == 1
