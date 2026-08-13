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


class StockMovement(Base):
    __tablename__ = "stock_movements"

    # =========================================================
    # PRIMARY KEY
    # =========================================================

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
    # PRODUCT
    # =========================================================

    productId = Column(
        "productId",
        Integer,
        ForeignKey(
            "products.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # =========================================================
    # MOVEMENT TYPE
    # Example:
    # Sale
    # Purchase
    # Stock Adjustment
    # Return
    # =========================================================

    movementType = Column(
        "movementType",
        String(50),
        nullable=False,
    )

    # =========================================================
    # QUANTITY
    # =========================================================

    quantity = Column(
        Integer,
        nullable=False,
    )

    # =========================================================
    # STOCK BEFORE MOVEMENT
    # =========================================================

    previousStock = Column(
        "previousStock",
        Integer,
        nullable=False,
    )

    # =========================================================
    # STOCK AFTER MOVEMENT
    # =========================================================

    newStock = Column(
        "newStock",
        Integer,
        nullable=False,
    )

    # =========================================================
    # REFERENCE
    # =========================================================

    referenceType = Column(
        "referenceType",
        String(50),
        nullable=True,
    )

    referenceId = Column(
        "referenceId",
        Integer,
        nullable=True,
    )

    # =========================================================
    # UNIT PRICE
    # =========================================================

    unitPrice = Column(
        "unitPrice",
        Float,
        nullable=True,
    )

    # =========================================================
    # NOTES
    # =========================================================

    notes = Column(
        "notes",
        String(255),
        nullable=True,
    )

    # =========================================================
    # CREATED DATE
    # =========================================================

    createdAt = Column(
        "createdAt",
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # =========================================================
    # PRODUCT RELATIONSHIP
    # =========================================================

    product = relationship(
        "Product",
        back_populates="stock_movements",
    )