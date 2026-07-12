from uuid import uuid4


class ChunkingService:
    def chunk_pages(self, workspace_id: str, document_id: str, pages: list[dict], chunk_size: int = 1800, overlap: int = 200) -> list[dict]:
        chunks: list[dict] = []
        for page in pages:
            text = page.get("text", "").strip()
            if not text:
                continue
            start = 0
            while start < len(text):
                end = start + chunk_size
                chunk_text = text[start:end]
                # Only add non-trivial chunks
                if len(chunk_text.strip()) > 20:
                    chunks.append({
                        "_id": f"chunk_{uuid4().hex[:12]}",
                        "workspace_id": workspace_id,
                        "document_id": document_id,
                        "page_start": page["page"],
                        "page_end": page["page"],
                        "text": chunk_text,
                        "embedding": None,
                    })
                if end >= len(text):
                    break
                start = end - overlap
        return chunks
