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


class ProductStatus(str, enum.Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    OUT_OF_STOCK = "Out of Stock"


class Product(Base):
    __tablename__ = "products"

    __table_args__ = (
        UniqueConstraint(
            "companyId",
            "sku",
            name="uq_company_sku",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    companyId = Column(
        "companyId",
        Integer,
        nullable=False,
        index=True,
    )

    categoryId = Column(
        "categoryId",
        Integer,
        ForeignKey("categories.id", ondelete="CASCADE"),
        nullable=False,
    )

    name = Column(String(100), nullable=False)

    sku = Column(String(50), nullable=False)

    brand = Column(String(100), nullable=True)

    description = Column(String(255), nullable=True)

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

    status = Column(
        Enum(ProductStatus),
        nullable=False,
        default=ProductStatus.ACTIVE,
    )

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

    category = relationship(
        "Category",
        backref="products",
    )
    
    inventory = relationship(
    "Inventory",
    back_populates="product",
    uselist=False
)