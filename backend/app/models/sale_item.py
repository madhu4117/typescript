from sqlalchemy import (
    Column,
    Integer,
    Float,
    ForeignKey,
)

from sqlalchemy.orm import relationship

from app.database.database import Base


# =========================================================
# SALE ITEM MODEL
# =========================================================

class SaleItem(Base):

    __tablename__ = "sale_items"

    # =====================================================
    # PRIMARY KEY
    # =====================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # =====================================================
    # SALE
    # =====================================================

    saleId = Column(
        "saleId",
        Integer,
        ForeignKey(
            "sales.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # =====================================================
    # PRODUCT
    # =====================================================

    productId = Column(
        "productId",
        Integer,
        ForeignKey(
            "products.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    # =====================================================
    # CATEGORY
    # =====================================================

    categoryId = Column(
        "categoryId",
        Integer,
        ForeignKey(
            "categories.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    # =====================================================
    # QUANTITY
    # =====================================================

    quantity = Column(
        Integer,
        nullable=False,
    )

    # =====================================================
    # UNIT PRICE
    # =====================================================

    unitPrice = Column(
        "unitPrice",
        Float,
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

    total = Column(
        Float,
        nullable=False,
    )

    # =====================================================
    # SALE RELATIONSHIP
    # =====================================================

    sale = relationship(
        "Sale",
        back_populates="sale_items",
    )

    # =====================================================
    # PRODUCT RELATIONSHIP
    # =====================================================

    product = relationship(
        "Product",
    )

    # =====================================================
    # CATEGORY RELATIONSHIP
    # =====================================================

    category = relationship(
        "Category",
    )