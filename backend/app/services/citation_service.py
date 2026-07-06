class CitationService:
    def build_citation(self, chunk: dict, citation_id: str | None = None) -> dict:
        citation = {
            "document_id": chunk["document_id"],
            "page": chunk.get("page_start"),
            "chunk_id": chunk["_id"],
            "snippet": chunk.get("text", "")[:240],
        }
        if citation_id:
            citation["citation_id"] = citation_id
        if "score" in chunk:
            citation["score"] = chunk["score"]
        return citation
