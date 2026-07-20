from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import User
from app.utils.security import get_current_admin
from app.models.audit_log import AuditLog
from app.schemas.audit_schema import AuditLogResponse
from typing import List

router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"]
)


@router.get("/", response_model=List[AuditLogResponse])
def get_audit_logs(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    logs = db.query(AuditLog).filter(
        AuditLog.companyId == admin.company_id
    ).order_by(AuditLog.timestamp.desc()).all()

    return logs
