from typing import Any
from app.repositories.notification_repository import NotificationRepository

class NotificationService:
    def __init__(self) -> None:
        self.repo = NotificationRepository()

    async def create_notification(self, workspace_id: str, message: str, notification_type: str = "info") -> dict[str, Any]:
        data = {
            "workspace_id": workspace_id,
            "message": message,
            "type": notification_type,
        }
        return await self.repo.create(data)

    async def list_notifications(self, workspace_id: str, limit: int = 50) -> list[dict[str, Any]]:
        return await self.repo.find_by_workspace(workspace_id, limit)

    async def mark_as_read(self, notification_id: str) -> bool:
        return await self.repo.mark_as_read(notification_id)
