from app.agents.base_agent import BaseAgent, AgentResult
from app.repositories.document_repository import DocumentRepository
from app.repositories.chunk_repository import ChunkRepository
from app.services.parsing_service import ParsingService
from app.services.chunking_service import ChunkingService
from app.services.embedding_service import EmbeddingService


class DocumentAgent(BaseAgent):
    name = "DocumentAgent"
    description = "Parses, chunks, embeds and indexes uploaded documents."

    def __init__(self) -> None:
        self.documents = DocumentRepository()
        self.chunks = ChunkRepository()
        self.parser = ParsingService()
        self.chunker = ChunkingService()
        self.embedder = EmbeddingService()

    async def run(self, state: dict) -> AgentResult:
        document_id = state["document_id"]
        doc = await self.documents.get_by_id(document_id)
        if not doc:
            return AgentResult(agent_name=self.name, status="failed", errors=["Document not found"])

        await self.documents.update_status(document_id, "parsing")
        pages = self.parser.parse_pdf_pages(doc["file_path"])
        chunks = self.chunker.chunk_pages(doc["workspace_id"], document_id, pages)
        embeddings = self.embedder.embed_documents([c["text"] for c in chunks])
        for chunk, embedding in zip(chunks, embeddings):
            chunk["embedding"] = embedding

        count = await self.chunks.insert_many(chunks)
        await self.documents.update_status(document_id, "indexed")
        return AgentResult(agent_name=self.name, status="success", output={"pages_processed": len(pages), "chunks_created": count})
