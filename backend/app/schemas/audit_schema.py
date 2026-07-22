from pydantic import BaseModel
from datetime import datetime


class AuditLogResponse(BaseModel):
    id: int
    companyId: int
    targetName: str
    action: str
    performedBy: str
    timestamp: datetime

    model_config = {
    "from_attributes": True
}
