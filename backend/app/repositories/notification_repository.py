from datetime import datetime, timezone
from typing import Any, Mapping
from bson.objectid import ObjectId

from app.db.mongo import db

class NotificationRepository:
    def __init__(self) -> None:
        self.collection = db["notifications"]

    async def create(self, data: dict[str, Any]) -> dict[str, Any]:
        doc = {**data}
        if "timestamp" not in doc:
            doc["timestamp"] = datetime.now(timezone.utc).isoformat()
        if "read" not in doc:
            doc["read"] = False
            
        result = await self.collection.insert_one(doc)
        doc["id"] = str(result.inserted_id)
        doc.pop("_id", None)
        return doc

    async def find_by_workspace(self, workspace_id: str, limit: int = 50) -> list[dict[str, Any]]:
        cursor = self.collection.find({"workspace_id": workspace_id}).sort("timestamp", -1).limit(limit)
        docs = await cursor.to_list(length=limit)
        for d in docs:
            d["id"] = str(d.pop("_id"))
        return docs

    async def mark_as_read(self, notification_id: str) -> bool:
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(notification_id)},
                {"$set": {"read": True}}
            )
            return result.modified_count > 0
        except Exception:
            return False
