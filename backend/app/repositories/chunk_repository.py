from app.repositories.base import BaseRepository


class ChunkRepository(BaseRepository):
    collection_name = "chunks"

    async def insert_many(self, chunks: list[dict]) -> int:
        if not chunks:
            return 0
        result = await self.collection.insert_many(chunks)
        return len(result.inserted_ids)

    async def delete_by_document(self, document_id: str) -> int:
        result = await self.collection.delete_many({"document_id": document_id})
        return result.deleted_count

    async def find_by_workspace(self, workspace_id: str, limit: int = 100) -> list[dict]:
        items = []
        async for item in self.collection.find({"workspace_id": workspace_id}).limit(limit):
            items.append(item)
        return items

    async def find_by_document(self, document_id: str, limit: int = 1000) -> list[dict]:
        items = []
        cursor = self.collection.find({"document_id": document_id}).sort("page_start", 1).limit(limit)
        async for item in cursor:
            items.append(item)
        return items
