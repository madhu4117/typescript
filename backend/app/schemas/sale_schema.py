from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# ==================================================
# SALE ITEM
# ==================================================

class SaleItemBase(BaseModel):
    productId: int
    categoryId: int
    quantity: int = Field(..., gt=0)
    unitPrice: float = Field(..., ge=0)
    discount: float = Field(0, ge=0)
    tax: float = Field(0, ge=0)


class SaleItemCreate(SaleItemBase):
    pass


class SaleItemResponse(SaleItemBase):
    id: int
    total: float

    model_config = {
        "from_attributes": True
    }


# ==================================================
# SALE
# ==================================================

class SaleBase(BaseModel):
    customerId: int
    salesChannel: str
    paymentMethod: str


class SaleCreate(SaleBase):
    items: List[SaleItemCreate]


class SaleUpdate(BaseModel):
    customerId: Optional[int] = None
    salesChannel: Optional[str] = None
    paymentMethod: Optional[str] = None


class SaleResponse(SaleBase):
    id: int
    companyId: int
    invoiceNumber: str
    customerName: str
    saleDate: datetime
    totalAmount: float
    createdBy: str
    createdAt: datetime
    updatedAt: datetime
    items: List[SaleItemResponse] = []

    model_config = {
        "from_attributes": True
    }