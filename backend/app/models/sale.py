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


# =========================================================
# SALE MODEL
# =========================================================

class Sale(Base):

    __tablename__ = "sales"

    # =====================================================
    # PRIMARY KEY
    # =====================================================

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
    # CUSTOMER
    # =====================================================

    customerId = Column(
        "customerId",
        Integer,
        ForeignKey(
            "customers.id",
        ),
        nullable=False,
        index=True,
    )

    customerName = Column(
        "customerName",
        String(255),
        nullable=False,
    )

    # =====================================================
    # INVOICE
    # =====================================================

    invoiceNumber = Column(
        "invoiceNumber",
        String(100),
        nullable=False,
        unique=True,
        index=True,
    )

    # =====================================================
    # SALE DATE
    # =====================================================

    saleDate = Column(
        "saleDate",
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # =====================================================
    # SALES CHANNEL
    # =====================================================

    salesChannel = Column(
        "salesChannel",
        String(50),
        nullable=False,
    )

    # =====================================================
    # PAYMENT
    # =====================================================

    paymentMethod = Column(
        "paymentMethod",
        String(50),
        nullable=False,
    )

    # =====================================================
    # DISCOUNT
    # =====================================================

    discount = Column(
        Float,
        nullable=False,
        default=0,
    )

    # =====================================================
    # TAX
    # =====================================================

    tax = Column(
        Float,
        nullable=False,
        default=0,
    )

    # =====================================================
    # TOTAL
    # =====================================================

    totalAmount = Column(
        "totalAmount",
        Float,
        nullable=False,
        default=0,
    )

    # =====================================================
    # STATUS
    # =====================================================

    status = Column(
        String(30),
        nullable=False,
        default="Completed",
    )

    # =====================================================
    # NOTES
    # =====================================================

    notes = Column(
        String(500),
        nullable=True,
    )

    # =====================================================
    # CREATED BY
    # =====================================================

    createdBy = Column(
        "createdBy",
        String(255),
        nullable=False,
    )

    # =====================================================
    # CREATED AT
    # =====================================================

    createdAt = Column(
        "createdAt",
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # =====================================================
    # UPDATED AT
    # =====================================================

    updatedAt = Column(
        "updatedAt",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # =====================================================
    # CUSTOMER RELATIONSHIP
    # =====================================================

    customer = relationship(
        "Customer",
        foreign_keys=[customerId],
    )

    # =====================================================
    # SALE ITEMS
    # =====================================================

    sale_items = relationship(
        "SaleItem",
        back_populates="sale",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )