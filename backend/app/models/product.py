import enum

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Enum,
    UniqueConstraint,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.database import Base


# =========================================================
# PRODUCT STATUS
# =========================================================

class ProductStatus(str, enum.Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    OUT_OF_STOCK = "Out of Stock"


# =========================================================
# PRODUCT MODEL
# =========================================================

class Product(Base):

    __tablename__ = "products"

    __table_args__ = (
        UniqueConstraint(
            "companyId",
            "sku",
            name="uq_company_sku",
        ),
    )

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
    # CATEGORY
    # =========================================================

    categoryId = Column(
        "categoryId",
        Integer,
        ForeignKey(
            "categories.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    # =========================================================
    # PRODUCT INFORMATION
    # =========================================================

    name = Column(
        String(100),
        nullable=False,
    )

    sku = Column(
        String(50),
        nullable=False,
    )

    brand = Column(
        String(100),
        nullable=True,
    )

    description = Column(
        String(255),
        nullable=True,
    )

    # =========================================================
    # PRICING
    # =========================================================

    unitPrice = Column(
        "unitPrice",
        Float,
        nullable=False,
    )

    costPrice = Column(
        "costPrice",
        Float,
        nullable=False,
    )

    # =========================================================
    # STOCK
    # =========================================================

    stockQuantity = Column(
        "stockQuantity",
        Integer,
        nullable=False,
        default=0,
    )

    unitOfMeasure = Column(
        "unitOfMeasure",
        String(50),
        nullable=True,
    )

    # =========================================================
    # STATUS
    # =========================================================

    status = Column(
        Enum(ProductStatus),
        nullable=False,
        default=ProductStatus.ACTIVE,
    )

    # =========================================================
    # TIMESTAMPS
    # =========================================================

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

    # =========================================================
    # CATEGORY RELATIONSHIP
    # =========================================================

    category = relationship(
        "Category",
        backref="products",
    )

    # =========================================================
    # INVENTORY RELATIONSHIP
    # =========================================================

    inventory = relationship(
        "Inventory",
        back_populates="product",
        uselist=False,
    )

    # =========================================================
    # STOCK MOVEMENT RELATIONSHIP
    # =========================================================

    stock_movements = relationship(
        "StockMovement",
        back_populates="product",
        cascade="all, delete-orphan",
    )

    # =========================================================
    # SALE ITEMS RELATIONSHIP
    # =========================================================
    # IMPORTANT:
    # SaleItem has:
    #
    # product = relationship(
    #     "Product",
    #     back_populates="sale_items"
    # )
    #
    # Therefore Product must also have sale_items.

    sale_items = relationship(
        "SaleItem",
        back_populates="product",
    )