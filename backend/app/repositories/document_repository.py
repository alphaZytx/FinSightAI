from datetime import datetime, timezone
from uuid import uuid4

from app.repositories.base import BaseRepository


class DocumentRepository(BaseRepository):
    collection_name = "documents"

    async def create(self, payload: dict) -> dict:
        doc = {"_id": f"doc_{uuid4().hex[:12]}", **payload, "created_at": datetime.now(timezone.utc)}
        await self.collection.insert_one(doc)
        return doc

    async def get_by_id(self, document_id: str) -> dict | None:
        return await self.collection.find_one({"_id": document_id})

    async def find_by_workspace(self, workspace_id: str, limit: int = 200) -> list[dict]:
        items = []
        cursor = self.collection.find({"workspace_id": workspace_id}).sort("created_at", -1).limit(limit)
        async for item in cursor:
            items.append(item)
        return items

    async def update_status(self, document_id: str, status: str) -> None:
        await self.collection.update_one({"_id": document_id}, {"$set": {"status": status}})

    async def delete(self, document_id: str) -> bool:
        result = await self.collection.delete_one({"_id": document_id})
        return result.deleted_count == 1
