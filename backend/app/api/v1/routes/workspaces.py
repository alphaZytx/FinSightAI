from fastapi import APIRouter

from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.workspace import WorkspaceCreate
from app.services.workspace_analysis_service import WorkspaceAnalysisService

router = APIRouter()
repo = WorkspaceRepository()
analysis_service = WorkspaceAnalysisService()


@router.post("")
async def create_workspace(payload: WorkspaceCreate):
    return await repo.create(payload.model_dump())


@router.post("/default")
async def get_default_workspace():
    return await repo.get_or_create_default()


@router.get("")
async def list_workspaces():
    return await repo.list_all()


@router.get("/{workspace_id}/analysis")
async def get_workspace_analysis(workspace_id: str):
    return await analysis_service.get_analysis(workspace_id)
