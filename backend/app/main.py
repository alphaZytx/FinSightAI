import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings

logger = logging.getLogger("finsight-ai")

app = FastAPI(title=settings.APP_NAME, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
async def on_startup():
    """Create MongoDB indexes and verify database connectivity."""
    try:
        from app.db.indexes import create_indexes

        await create_indexes()
        logger.info("MongoDB indexes created successfully.")
    except Exception as exc:
        logger.warning(
            "Could not create MongoDB indexes (is the database reachable?): %s", exc
        )


@app.get("/health")
async def health_check():
    """Basic health check, also probes MongoDB connectivity."""
    mongo_status = "unknown"
    try:
        from app.db.mongo import client

        if client is not None:
            await client.admin.command("ping")
            mongo_status = "connected"
        else:
            mongo_status = "not_configured"
    except Exception:
        mongo_status = "unreachable"

    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "llm_provider": settings.LLM_PROVIDER,
        "mongo": mongo_status,
    }
