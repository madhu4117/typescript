from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    companyId = Column("companyId", Integer, nullable=False, index=True)
    targetName = Column("targetName", String(255), nullable=False)
    action = Column(String(100), nullable=False)
    performedBy = Column("performedBy", String(255), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
