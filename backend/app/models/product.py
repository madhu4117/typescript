from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    companyId = Column("companyId", Integer, nullable=False, index=True)
    categoryId = Column("categoryId", Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    sku = Column(String(50), nullable=False)
    brand = Column(String(100), nullable=True)
    description = Column(String(255), nullable=True)
    unitPrice = Column("unitPrice", Float, nullable=False)
    costPrice = Column("costPrice", Float, nullable=False)
    stockQuantity = Column("stockQuantity", Integer, nullable=False, default=0)
    unitOfMeasure = Column("unitOfMeasure", String(50), nullable=True)
    status = Column(String(20), default="Active", nullable=False)
    createdAt = Column("createdAt", DateTime(timezone=True), server_default=func.now(), nullable=False)
    updatedAt = Column("updatedAt", DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    category = relationship("Category", backref="products")
