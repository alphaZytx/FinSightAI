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

    async def update_status(self, document_id: str, status: str) -> None:
        await self.collection.update_one({"_id": document_id}, {"$set": {"status": status}})
