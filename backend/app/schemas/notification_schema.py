from datetime import datetime
from typing import Optional, List, Any

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):

    id: int

    companyId: int

    userId: int

    type: str

    title: str

    message: str

    priority: str

    resourceType: Optional[str] = None

    resourceId: Optional[int] = None

    isRead: bool

    readAt: Optional[datetime] = None

    createdAt: datetime

    resolvedAt: Optional[datetime] = None

    expiresAt: Optional[datetime] = None

    details: Optional[Any] = None

    model_config = ConfigDict(
        from_attributes=True
    )


class NotificationPaginationResponse(BaseModel):

    items: List[NotificationResponse]

    total: int

    page: int

    limit: int

    totalPages: int

    unreadCount: int = 0


class NotificationUnreadCountResponse(BaseModel):

    unreadCount: int


class NotificationReadResponse(BaseModel):

    message: str

    notification: NotificationResponse


class NotificationReadAllResponse(BaseModel):

    message: str

    updatedCount: int