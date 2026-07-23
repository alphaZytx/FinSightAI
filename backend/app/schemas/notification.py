from datetime import datetime
from pydantic import BaseModel, Field

class NotificationCreate(BaseModel):
    workspace_id: str
    message: str
    type: str = "info"  # "success", "info", "warning", "error"

class NotificationResponse(NotificationCreate):
    id: str
    read: bool = False
    timestamp: datetime
