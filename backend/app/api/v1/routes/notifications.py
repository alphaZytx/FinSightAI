from fastapi import APIRouter, Query, HTTPException
from typing import List
from app.schemas.notification import NotificationResponse
from app.services.notification_service import NotificationService

router = APIRouter()
service = NotificationService()

@router.get("", response_model=List[NotificationResponse])
async def list_notifications(workspace_id: str = Query(..., description="The workspace ID to fetch notifications for")):
    return await service.list_notifications(workspace_id)

@router.put("/{notification_id}/read")
async def mark_notification_as_read(notification_id: str):
    success = await service.mark_as_read(notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found or could not be updated")
    return {"status": "success", "read": True}
