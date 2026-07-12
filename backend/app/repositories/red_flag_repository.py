from app.repositories.base import BaseRepository


class RedFlagRepository(BaseRepository):
    collection_name = "red_flags"

    async def insert_many(self, red_flags: list[dict]) -> int:
        if not red_flags:
            return 0
        result = await self.collection.insert_many(red_flags)
        return len(result.inserted_ids)

    async def delete_by_document(self, document_id: str) -> int:
        result = await self.collection.delete_many({"document_id": document_id})
        return result.deleted_count

    async def delete_by_workspace(self, workspace_id: str) -> int:
        result = await self.collection.delete_many({"workspace_id": workspace_id})
        return result.deleted_count

    async def find_by_document_ids(self, document_ids: list[str], limit: int = 2000) -> list[dict]:
        if not document_ids:
            return []
        items = []
        cursor = self.collection.find({"document_id": {"$in": document_ids}}).sort([("company_name", 1), ("severity", 1)]).limit(limit)
        async for item in cursor:
            items.append(item)
        return items

    async def find_by_workspace(self, workspace_id: str, limit: int = 1000) -> list[dict]:
        items = []
        async for item in self.collection.find({"workspace_id": workspace_id}).limit(limit):
            items.append(item)
        return items
