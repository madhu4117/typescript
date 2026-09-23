from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # =========================================================
    # COMPANY
    # =========================================================

    companyId = Column(
        "companyId",
        Integer,
        nullable=False,
        index=True,
    )

    # =========================================================
    # USER
    # =========================================================

    userId = Column(
        "userId",
        Integer,
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    userName = Column(
        "userName",
        String(150),
        nullable=True,
    )

    userEmail = Column(
        "userEmail",
        String(150),
        nullable=True,
    )

    # =========================================================
    # ACTION
    # =========================================================

    action = Column(
        String(100),
        nullable=False,
        index=True,
    )

    resourceType = Column(
        "resourceType",
        String(100),
        nullable=False,
        default="System",
        index=True,
    )

    resourceId = Column(
        "resourceId",
        Integer,
        nullable=True,
        index=True,
    )

    description = Column(
        Text,
        nullable=True,
    )

    # =========================================================
    # REQUEST INFORMATION
    # =========================================================

    ipAddress = Column(
        "ipAddress",
        String(100),
        nullable=True,
    )

    userAgent = Column(
        "userAgent",
        Text,
        nullable=True,
    )

    # =========================================================
    # BEFORE / AFTER DATA
    # =========================================================

    beforeData = Column(
        "beforeData",
        Text,
        nullable=True,
    )

    afterData = Column(
        "afterData",
        Text,
        nullable=True,
    )

    # =========================================================
    # STATUS
    # =========================================================

    status = Column(
        String(50),
        nullable=False,
        default="SUCCESS",
        index=True,
    )

    # =========================================================
    # CREATED TIME
    # =========================================================

    createdAt = Column(
        "createdAt",
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # =========================================================
    # LEGACY FIELDS
    # =========================================================

    targetName = Column(
        "targetName",
        String(255),
        nullable=True,
    )

    performedBy = Column(
        "performedBy",
        String(255),
        nullable=True,
    )

    # =========================================================
    # USER RELATIONSHIP
    # =========================================================

    user = relationship(
        "User",
        foreign_keys=[userId],
        lazy="joined",
    )