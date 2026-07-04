from app.db.mongo import db


async def create_indexes() -> None:
    await db.workspaces.create_index("name")
    await db.documents.create_index([("workspace_id", 1), ("company_name", 1)])
    await db.chunks.create_index([("workspace_id", 1), ("document_id", 1)])
    await db.financial_metrics.create_index([("workspace_id", 1), ("company_name", 1), ("metric_name", 1)])
    await db.red_flags.create_index([("workspace_id", 1), ("severity", 1)])
