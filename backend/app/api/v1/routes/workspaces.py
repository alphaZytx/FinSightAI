from fastapi import APIRouter
from app.schemas.workspace import WorkspaceCreate
from app.repositories.workspace_repository import WorkspaceRepository

router = APIRouter()
repo = WorkspaceRepository()


@router.post("")
async def create_workspace(payload: WorkspaceCreate):
    return await repo.create(payload.model_dump())


@router.get("")
async def list_workspaces():
    return await repo.list_all()
