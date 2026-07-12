from fastapi import APIRouter

from app.api.v1.routes import agents, comparison, documents, reports, research, workspaces
from app.api.v1.routes import auth

api_router = APIRouter()

# Public — no auth required
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])

# Protected — require a valid Bearer token (enforced per-route via Depends)
api_router.include_router(workspaces.router, prefix="/workspaces", tags=["workspaces"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
api_router.include_router(research.router, prefix="/research", tags=["research"])
api_router.include_router(comparison.router, prefix="/comparison", tags=["comparison"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
