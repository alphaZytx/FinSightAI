from app.repositories.base import BaseRepository


class ReportRepository(BaseRepository):
    collection_name = "reports"

    async def create(self, payload: dict) -> dict:
        await self.collection.insert_one(payload)
        return payload

    async def delete_by_workspace(self, workspace_id: str) -> int:
        result = await self.collection.delete_many({"workspace_id": workspace_id})
        return result.deleted_count
