from app.repositories.base import BaseRepository


class MetricRepository(BaseRepository):
    collection_name = "financial_metrics"

    async def insert_many(self, metrics: list[dict]) -> int:
        if not metrics:
            return 0
        result = await self.collection.insert_many(metrics)
        return len(result.inserted_ids)

    async def delete_by_document(self, document_id: str) -> int:
        result = await self.collection.delete_many({"document_id": document_id})
        return result.deleted_count

    async def find_by_document(self, document_id: str, limit: int = 500) -> list[dict]:
        items = []
        cursor = self.collection.find({"document_id": document_id}).sort([("metric_name", 1), ("period", 1)]).limit(limit)
        async for item in cursor:
            items.append(item)
        return items

    async def find_by_workspace(self, workspace_id: str, limit: int = 1000) -> list[dict]:
        items = []
        cursor = self.collection.find({"workspace_id": workspace_id}).sort([("company_name", 1), ("metric_name", 1), ("period", 1)]).limit(limit)
        async for item in cursor:
            items.append(item)
        return items
