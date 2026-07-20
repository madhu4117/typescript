from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog


def log_event(db: Session, company_id: int, target_name: str, action: str, performed_by: str):
    """
    Log an administrative action in the audit logs.
    """
    db_log = AuditLog(
        companyId=company_id,
        targetName=target_name,
        action=action,
        performedBy=performed_by
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log
