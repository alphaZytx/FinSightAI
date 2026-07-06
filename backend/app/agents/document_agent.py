from app.agents.base_agent import AgentResult, BaseAgent
from app.repositories.chunk_repository import ChunkRepository
from app.repositories.document_repository import DocumentRepository
from app.services.chunking_service import ChunkingService
from app.services.embedding_service import EmbeddingService
from app.services.parsing_service import ParsingService


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
        document_id = state.get("document_id")
        if not document_id:
            return AgentResult(agent_name=self.name, status="failed", errors=["document_id is required"])
        document = await self.documents.get_by_id(document_id)
        if not document:
            return AgentResult(agent_name=self.name, status="failed", errors=["Document not found"])

        await self.documents.update_status(document_id, "parsing")
        try:
            pages = self.parser.parse_pdf_pages(document["file_path"])
            chunks = self.chunker.chunk_pages(document["workspace_id"], document_id, pages)
            if not chunks:
                await self.documents.update_status(document_id, "failed")
                return AgentResult(
                    agent_name=self.name,
                    status="failed",
                    errors=["No extractable text was found in the PDF. Use a text-based PDF or add OCR support."],
                )
            embeddings = self.embedder.embed_documents([chunk["text"] for chunk in chunks])
            for chunk, embedding in zip(chunks, embeddings):
                chunk["embedding"] = embedding
            await self.chunks.delete_by_document(document_id)
            count = await self.chunks.insert_many(chunks)
            await self.documents.update_status(document_id, "indexed")
        except Exception as exc:
            await self.documents.update_status(document_id, "failed")
            return AgentResult(agent_name=self.name, status="failed", errors=[f"Document ingestion failed: {exc}"])

        return AgentResult(
            agent_name=self.name,
            status="success",
            output={
                "workspace_id": document["workspace_id"],
                "pages_processed": len(pages),
                "chunks_created": count,
            },
        )
