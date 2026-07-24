from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime,
    Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.database import Base


class InventoryMovement(Base):
    __tablename__ = "inventory_movements"

    id = Column(Integer, primary_key=True, index=True)

    inventoryId = Column(
        Integer,
        ForeignKey("inventory.id", ondelete="CASCADE"),
        nullable=False
    )

    movementType = Column(
        String(50),
        nullable=False
    )
    # Stock Addition
    # Stock Removal
    # Manual Adjustment
    # Sale

    quantityChanged = Column(
        Integer,
        nullable=False
    )

    previousQuantity = Column(
        Integer,
        nullable=False
    )

    updatedQuantity = Column(
        Integer,
        nullable=False
    )

    reason = Column(
        String(255),
        nullable=False
    )

    remarks = Column(
        Text,
        nullable=True
    )

    performedBy = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    createdAt = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationships
    inventory = relationship(
        "Inventory",
        back_populates="movements"
    )

    user = relationship(
        "User"
    )