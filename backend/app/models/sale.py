from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.database import Base


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)

    companyId = Column(
        "companyId",
        Integer,
        nullable=False,
        index=True
    )

    invoiceNumber = Column(
        "invoiceNumber",
        String(30),
        unique=True,
        nullable=False
    )

    customerName = Column(
        "customerName",
        String(100),
        nullable=False
    )

    saleDate = Column(
        "saleDate",
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    salesChannel = Column(
        "salesChannel",
        String(30),
        nullable=False
    )

    paymentMethod = Column(
        "paymentMethod",
        String(30),
        nullable=False
    )

    totalAmount = Column(
        "totalAmount",
        Float,
        nullable=False
    )

    createdBy = Column(
        "createdBy",
        String(100),
        nullable=False
    )

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

    sale_items = relationship(
        "SaleItem",
        back_populates="sale",
        cascade="all, delete-orphan"
    )