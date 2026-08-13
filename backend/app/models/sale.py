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

    # ==================================================
    # PRIMARY KEY
    # ==================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # ==================================================
    # COMPANY
    # ==================================================

    companyId = Column(
        "companyId",
        Integer,
        nullable=False,
        index=True,
    )

    # ==================================================
    # CUSTOMER
    # ==================================================

    customerId = Column(
        "customerId",
        Integer,
        ForeignKey(
            "customers.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    customer = relationship(
        "Customer",
        back_populates="sales",
    )

    # ==================================================
    # INVOICE
    # ==================================================

    invoiceNumber = Column(
        "invoiceNumber",
        String(30),
        unique=True,
        nullable=False,
        index=True,
    )

    # ==================================================
    # CUSTOMER NAME
    # ==================================================

    customerName = Column(
        "customerName",
        String(200),
        nullable=False,
    )

    # ==================================================
    # SALE DATE
    # ==================================================

    saleDate = Column(
        "saleDate",
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # ==================================================
    # SALES CHANNEL
    # ==================================================

    salesChannel = Column(
        "salesChannel",
        String(50),
        nullable=False,
    )

    # ==================================================
    # PAYMENT METHOD
    # ==================================================

    paymentMethod = Column(
        "paymentMethod",
        String(50),
        nullable=False,
    )

    # ==================================================
    # DISCOUNT
    # ==================================================

    discount = Column(
        "discount",
        Float,
        nullable=False,
        default=0,
    )

    # ==================================================
    # TAX
    # ==================================================

    tax = Column(
        "tax",
        Float,
        nullable=False,
        default=0,
    )

    # ==================================================
    # TOTAL AMOUNT
    # ==================================================

    totalAmount = Column(
        "totalAmount",
        Float,
        nullable=False,
        default=0,
    )

    # ==================================================
    # STATUS
    # ==================================================

    status = Column(
        "status",
        String(30),
        nullable=False,
        default="Completed",
    )

    # ==================================================
    # NOTES
    # ==================================================

    notes = Column(
        "notes",
        String(500),
        nullable=True,
    )

    # ==================================================
    # CREATED BY
    # ==================================================

    createdBy = Column(
        "createdBy",
        String(100),
        nullable=False,
    )

    # ==================================================
    # TIMESTAMPS
    # ==================================================

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

    # ==================================================
    # SALE ITEMS
    # ==================================================

    sale_items = relationship(
        "SaleItem",
        back_populates="sale",
        cascade="all, delete-orphan",
    )