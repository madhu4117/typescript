from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    DateTime,
    String
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.database import Base


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)

    companyId = Column(
        Integer,
        nullable=False,
        index=True
    )

    productId = Column(
        Integer,
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    currentStock = Column(Integer, nullable=False, default=0)

    reservedStock = Column(Integer, nullable=False, default=0)

    availableStock = Column(Integer, nullable=False, default=0)

    reorderLevel = Column(Integer, nullable=False, default=10)

    stockStatus = Column(String(30), nullable=False, default="In Stock")

    updatedAt = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    product = relationship(
        "Product",
        back_populates="inventory"
    )

    movements = relationship(
        "InventoryMovement",
        back_populates="inventory",
        cascade="all, delete-orphan"
    )