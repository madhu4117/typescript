from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr


class ScheduledReportCreate(BaseModel):
    reportType: str

    filters: Optional[dict] = None

    frequency: str

    executionTime: str

    recipients: List[EmailStr]

    exportFormat: str

    isActive: bool = True


class ScheduledReportUpdate(BaseModel):
    reportType: Optional[str] = None
    filters: Optional[dict] = None
    frequency: Optional[str] = None
    executionTime: Optional[str] = None
    recipients: Optional[List[EmailStr]] = None
    exportFormat: Optional[str] = None
    isActive: Optional[bool] = None


class ScheduledReportResponse(BaseModel):
    id: int
    companyId: int
    createdBy: int

    reportType: str
    filters: Optional[str]

    frequency: str
    executionTime: str

    recipients: str

    exportFormat: str
    isActive: bool

    lastRunAt: Optional[datetime]
    lastStatus: Optional[str]
    lastError: Optional[str]
    nextRunAt: Optional[datetime]

    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True