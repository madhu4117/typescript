from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    DateTime,
    Date,
    ForeignKey,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.database import Base


class CustomerPurchaseSummary(Base):

    __tablename__ = "customer_purchase_summary"

    # --------------------------------------------------
    # Primary Key
    # --------------------------------------------------

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # --------------------------------------------------
    # Company
    # --------------------------------------------------

    companyId = Column(
        "companyId",
        Integer,
        nullable=False,
        index=True,
    )

    # --------------------------------------------------
    # Customer
    # --------------------------------------------------

    customerId = Column(
        "customerId",
        Integer,
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    # --------------------------------------------------
# Purchase Summary
# --------------------------------------------------

    totalOrders = Column(
    "totalOrders",
    Integer,
    default=0,
    nullable=False,
    )

    totalRevenue = Column(
    "totalRevenue",
    Float,
    default=0,
    nullable=False,
    )

    totalQuantity = Column(
    "totalQuantity",
    Integer,
    default=0,
    nullable=False,
    )

    averageOrderValue = Column(
    "averageOrderValue",
    Float,
    default=0,
    nullable=False,
    )

    purchaseFrequency = Column(
    "purchaseFrequency",
    Float,
    default=0,
    nullable=False,
    )
    # --------------------------------------------------
    # Purchase Dates
    # --------------------------------------------------

    firstPurchaseDate = Column(
        "firstPurchaseDate",
        DateTime(timezone=True),
        nullable=True,
    )

    lastPurchaseDate = Column(
        "lastPurchaseDate",
        DateTime(timezone=True),
        nullable=True,
    )

    # --------------------------------------------------
    # Favourite Product / Category
    # --------------------------------------------------

    frequentlyPurchasedProduct = Column(
        "frequentlyPurchasedProduct",
        String(150),
        nullable=True,
    )

    frequentlyPurchasedCategory = Column(
        "frequentlyPurchasedCategory",
        String(150),
        nullable=True,
    )

    # --------------------------------------------------
    # Customer Segment
    # --------------------------------------------------

    customerSegment = Column(
        "customerSegment",
        String(30),
        default="New",
        nullable=False,
    )

    # --------------------------------------------------
    # Timestamps
    # --------------------------------------------------

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

    # --------------------------------------------------
    # Relationship
    # --------------------------------------------------

    customer = relationship(
        "Customer",
        back_populates="purchase_summary",
    )