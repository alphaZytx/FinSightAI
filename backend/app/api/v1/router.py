from fastapi import APIRouter

from app.api.v1.routes import workspaces, documents, agents, research, comparison, reports

api_router = APIRouter()
api_router.include_router(workspaces.router, prefix="/workspaces", tags=["workspaces"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
api_router.include_router(research.router, prefix="/research", tags=["research"])
api_router.include_router(comparison.router, prefix="/comparison", tags=["comparison"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
