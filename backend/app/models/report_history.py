from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.database import Base


class ReportHistory(Base):

    __tablename__ = "report_history"

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

    userId = Column(
        "userId",
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

    reportName = Column(
        "reportName",
        String(255),
        nullable=False,
    )

    filters = Column(
        Text,
        nullable=True,
    )

    format = Column(
        String(20),
        nullable=False,
    )

    status = Column(
        String(30),
        nullable=False,
        default="Pending",
        index=True,
    )

    filePath = Column(
        "filePath",
        String(500),
        nullable=True,
    )

    errorMessage = Column(
        "errorMessage",
        Text,
        nullable=True,
    )

    createdAt = Column(
        "createdAt",
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    completedAt = Column(
        "completedAt",
        DateTime(timezone=True),
        nullable=True,
    )

    user = relationship("User", foreign_keys=[userId])