from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
)

from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.database import Base


class Sale(Base):

    __tablename__ = "sales"

    # --------------------------------------------------
    # Primary Key
    # --------------------------------------------------

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # --------------------------------------------------
    # Company
    # --------------------------------------------------

    companyId = Column(
        "companyId",
        Integer,
        nullable=False,
        index=True
    )

    # --------------------------------------------------
    # Customer
    # --------------------------------------------------

    customerId = Column(
        "customerId",
        Integer,
        ForeignKey(
            "customers.id",
            ondelete="RESTRICT"
        ),
        nullable=False,
        index=True,
    )

    customer = relationship(
        "Customer",
        back_populates="sales"
    )

    # --------------------------------------------------
    # Invoice
    # --------------------------------------------------

    invoiceNumber = Column(
        "invoiceNumber",
        String(30),
        unique=True,
        nullable=False
    )

    # --------------------------------------------------
    # Customer Name
    # --------------------------------------------------

    customerName = Column(
        "customerName",
        String(100),
        nullable=False
    )

    # --------------------------------------------------
    # Sale Date
    # --------------------------------------------------

    saleDate = Column(
        "saleDate",
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # --------------------------------------------------
    # Sales Channel
    # --------------------------------------------------

    salesChannel = Column(
        "salesChannel",
        String(30),
        nullable=False
    )

    # --------------------------------------------------
    # Payment Method
    # --------------------------------------------------

    paymentMethod = Column(
        "paymentMethod",
        String(30),
        nullable=False
    )

    # --------------------------------------------------
    # Total Amount
    # --------------------------------------------------

    totalAmount = Column(
        "totalAmount",
        Float,
        nullable=False
    )

    # --------------------------------------------------
    # Created By
    # --------------------------------------------------

    createdBy = Column(
        "createdBy",
        String(100),
        nullable=False
    )

    # --------------------------------------------------
    # Timestamps
    # --------------------------------------------------

    createdAt = Column(
        "createdAt",
        DateTime(timezone=True),
        server_default=func.now()
    )

    updatedAt = Column(
        "updatedAt",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    # --------------------------------------------------
    # Sale Items
    # --------------------------------------------------

    sale_items = relationship(
        "SaleItem",
        back_populates="sale",
        cascade="all, delete-orphan"
    )