from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.database import Base


class Notification(Base):

    __tablename__ = "notifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # =====================================================
    # COMPANY
    # =====================================================

    companyId = Column(
        "companyId",
        Integer,
        nullable=False,
        index=True,
    )

    # =====================================================
    # USER
    # =====================================================

    userId = Column(
        "userId",
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # =====================================================
    # NOTIFICATION
    # =====================================================

    type = Column(
        String(50),
        nullable=False,
        index=True,
    )

    title = Column(
        String(255),
        nullable=False,
    )

    message = Column(
        Text,
        nullable=False,
    )

    priority = Column(
        String(20),
        nullable=False,
        default="Low",
        index=True,
    )

    # =====================================================
    # RESOURCE
    # =====================================================

    resourceType = Column(
        "resourceType",
        String(100),
        nullable=True,
        index=True,
    )

    resourceId = Column(
        "resourceId",
        Integer,
        nullable=True,
        index=True,
    )

    # =====================================================
    # READ STATE
    # =====================================================

    isRead = Column(
        "isRead",
        Boolean,
        nullable=False,
        default=False,
        index=True,
    )

    readAt = Column(
        "readAt",
        DateTime(timezone=True),
        nullable=True,
    )

    # =====================================================
    # DUPLICATE PREVENTION
    # =====================================================

    dedupeKey = Column(
        "dedupeKey",
        String(255),
        nullable=True,
        index=True,
    )

    # =====================================================
    # LIFECYCLE
    # =====================================================

    resolvedAt = Column(
        "resolvedAt",
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    expiresAt = Column(
        "expiresAt",
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    # =====================================================
    # DETAILS & METADATA
    # =====================================================

    details = Column(
        "details",
        JSON,
        nullable=True,
    )

    # =====================================================
    # CREATED
    # =====================================================

    createdAt = Column(
        "createdAt",
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    # =====================================================
    # RELATIONSHIP
    # =====================================================

    user = relationship(
        "User",
        foreign_keys=[userId],
        lazy="joined",
    )