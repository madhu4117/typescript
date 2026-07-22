from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


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
    status: str = Field(default="Active", max_length=20)

    @model_validator(mode="after")
    def validate_prices(self):
        if self.costPrice > self.unitPrice:
            raise ValueError("Cost Price cannot exceed Unit Price")
        return self


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

    @model_validator(mode="after")
    def validate_prices(self):
        if (
            self.unitPrice is not None
            and self.costPrice is not None
            and self.costPrice > self.unitPrice
        ):
            raise ValueError("Cost Price cannot exceed Unit Price")
        return self


class ProductResponse(ProductBase):
    id: int
    companyId: int
    category_name: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    model_config = ConfigDict(from_attributes=True)