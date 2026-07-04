from uuid import uuid4


class ChunkingService:
    def chunk_pages(self, workspace_id: str, document_id: str, pages: list[dict], chunk_size: int = 1200) -> list[dict]:
        chunks: list[dict] = []
        for page in pages:
            text = page.get("text", "").strip()
            if not text:
                continue
            for start in range(0, len(text), chunk_size):
                chunk_text = text[start:start + chunk_size]
                chunks.append({
                    "_id": f"chunk_{uuid4().hex[:12]}",
                    "workspace_id": workspace_id,
                    "document_id": document_id,
                    "page_start": page["page"],
                    "page_end": page["page"],
                    "text": chunk_text,
                    "embedding": None,
                })
        return chunks
