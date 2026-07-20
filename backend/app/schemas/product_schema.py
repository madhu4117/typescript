from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ProductBase(BaseModel):
    categoryId: int
    name: str = Field(..., min_length=1, max_length=100)
    sku: str = Field(..., min_length=1, max_length=50)
    brand: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    unitPrice: float = Field(..., gt=0)
    costPrice: float = Field(..., ge=0)
    stockQuantity: int = Field(..., ge=0)
    unitOfMeasure: Optional[str] = Field(None, max_length=50)
    status: str = Field("Active", max_length=20)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    categoryId: Optional[int] = None
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    sku: Optional[str] = Field(None, min_length=1, max_length=50)
    brand: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    unitPrice: Optional[float] = Field(None, gt=0)
    costPrice: Optional[float] = Field(None, ge=0)
    stockQuantity: Optional[int] = Field(None, ge=0)
    unitOfMeasure: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, max_length=20)


class ProductResponse(ProductBase):
    id: int
    companyId: int
    category_name: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        orm_mode = True
        from_attributes = True
