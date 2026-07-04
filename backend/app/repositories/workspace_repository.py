from datetime import datetime, timezone
from uuid import uuid4
from app.repositories.base import BaseRepository


class WorkspaceRepository(BaseRepository):
    collection_name = "workspaces"

    async def create(self, payload: dict) -> dict:
        now = datetime.now(timezone.utc)
        doc = {"_id": f"ws_{uuid4().hex[:12]}", **payload, "created_at": now, "updated_at": now}
        await self.collection.insert_one(doc)
        return doc

    async def list_all(self) -> list[dict]:
        items = []
        async for item in self.collection.find({}).sort("created_at", -1):
            items.append(item)
        return items
