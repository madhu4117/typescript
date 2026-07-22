from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)

    saleId = Column(
        "saleId",
        Integer,
        ForeignKey("sales.id", ondelete="CASCADE"),
        nullable=False
    )

    productId = Column(
        "productId",
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    categoryId = Column(
        "categoryId",
        Integer,
        ForeignKey("categories.id"),
        nullable=False
    )

    quantity = Column(
        Integer,
        nullable=False
    )

    unitPrice = Column(
        "unitPrice",
        Float,
        nullable=False
    )

    discount = Column(
        Float,
        default=0
    )

    tax = Column(
        Float,
        default=0
    )

    total = Column(
        Float,
        nullable=False
    )

    sale = relationship(
        "Sale",
        back_populates="sale_items"
    )

    product = relationship("Product")

    category = relationship("Category")