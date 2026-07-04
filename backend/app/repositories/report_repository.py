from app.repositories.base import BaseRepository


class ReportRepository(BaseRepository):
    collection_name = "reports"

    async def create(self, payload: dict) -> dict:
        await self.collection.insert_one(payload)
        return payload
