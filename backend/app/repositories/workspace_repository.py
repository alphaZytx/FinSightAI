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

    async def get_or_create_default(self) -> dict:
        existing = await self.collection.find_one({"is_default": True})
        if existing:
            return existing

        # Preserve the latest existing research data when simplifying an older UI.
        latest = await self.collection.find_one({}, sort=[("created_at", -1)])
        if latest:
            await self.collection.update_one({"_id": latest["_id"]}, {"$set": {"is_default": True}})
            latest["is_default"] = True
            return latest

        return await self.create({
            "name": "Default Research",
            "description": "Automatic local research context.",
            "is_default": True,
        })

    async def list_all(self) -> list[dict]:
        items = []
        async for item in self.collection.find({}).sort("created_at", -1):
            items.append(item)
        return items
