from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.database import Base


class ScheduledReport(Base):

    __tablename__ = "scheduled_reports"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    companyId = Column(
        "companyId",
        Integer,
        nullable=False,
        index=True,
    )

    createdBy = Column(
        "createdBy",
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    reportType = Column(
        "reportType",
        String(100),
        nullable=False,
        index=True,
    )

    filters = Column(
        Text,
        nullable=True,
    )

    frequency = Column(
        String(20),
        nullable=False,
    )

    executionTime = Column(
        "executionTime",
        String(10),
        nullable=False,
    )

    recipients = Column(
        Text,
        nullable=False,
    )

    exportFormat = Column(
        "exportFormat",
        String(20),
        nullable=False,
    )

    isActive = Column(
        "isActive",
        Boolean,
        nullable=False,
        default=True,
        index=True,
    )

    lastRunAt = Column(
        "lastRunAt",
        DateTime(timezone=True),
        nullable=True,
    )

    lastStatus = Column(
        "lastStatus",
        String(30),
        nullable=True,
    )

    lastError = Column(
        "lastError",
        Text,
        nullable=True,
    )

    nextRunAt = Column(
        "nextRunAt",
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    createdAt = Column(
        "createdAt",
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updatedAt = Column(
        "updatedAt",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    creator = relationship("User", foreign_keys=[createdBy])