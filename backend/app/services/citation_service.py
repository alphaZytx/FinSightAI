class CitationService:
    def build_citation(self, chunk: dict) -> dict:
        return {
            "document_id": chunk["document_id"],
            "page": chunk.get("page_start"),
            "chunk_id": chunk["_id"],
            "snippet": chunk.get("text", "")[:240],
        }
