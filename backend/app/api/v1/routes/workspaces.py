from fastapi import APIRouter

from app.repositories.workspace_repository import WorkspaceRepository
from app.schemas.workspace import WorkspaceCreate
from app.services.workspace_analysis_service import WorkspaceAnalysisService
from app.services.workspace_service import WorkspaceService

router = APIRouter()
repo = WorkspaceRepository()
analysis_service = WorkspaceAnalysisService()
workspace_service = WorkspaceService()


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


@router.delete("/{workspace_id}/data")
async def clear_workspace_data(workspace_id: str):
    return await workspace_service.clear_workspace_data(workspace_id)
