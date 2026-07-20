from pydantic import BaseModel
from datetime import datetime


class AuditLogResponse(BaseModel):
    id: int
    companyId: int
    targetName: str
    action: str
    performedBy: str
    timestamp: datetime

    class Config:
        orm_mode = True
        from_attributes = True
