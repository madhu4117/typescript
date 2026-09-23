from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Any, Dict


class AuditLogUserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: Optional[str] = None

    model_config = {
        "from_attributes": True
    }


class AuditLogResponse(BaseModel):
    id: int
    companyId: int
    userId: Optional[int] = None
    userName: Optional[str] = None
    userEmail: Optional[str] = None

    action: str
    resourceType: str = "System"
    resourceId: Optional[int] = None

    description: Optional[str] = None
    ipAddress: Optional[str] = None
    userAgent: Optional[str] = None

    beforeData: Optional[Any] = None
    afterData: Optional[Any] = None

    status: str = "SUCCESS"
    createdAt: datetime

    user: Optional[AuditLogUserResponse] = None

    model_config = {
        "from_attributes": True
    }


class AuditLogPaginationResponse(BaseModel):
    items: List[AuditLogResponse]
    total: int
    page: int
    limit: int
    totalPages: int


class AuditLogFilterOptionsResponse(BaseModel):
    actions: List[str]
    resourceTypes: List[str]
    users: List[Dict[str, Any]]
    statuses: List[str]


class ClearLogsRequest(BaseModel):
    retention_days: Optional[int] = Field(None, description="Clear logs older than X days. If None, clear all.")
    confirm: bool = Field(False, description="Explicit confirmation flag")
