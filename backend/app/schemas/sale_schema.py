from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# -----------------------------
# Sale Item
# -----------------------------

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


# -----------------------------
# Sale
# -----------------------------

class SaleBase(BaseModel):
    customerName: str = Field(..., min_length=1, max_length=100)
    salesChannel: str
    paymentMethod: str


class SaleCreate(SaleBase):
    items: List[SaleItemCreate]


class SaleUpdate(BaseModel):
    customerName: Optional[str] = None
    salesChannel: Optional[str] = None
    paymentMethod: Optional[str] = None


class SaleResponse(SaleBase):
    id: int
    companyId: int
    invoiceNumber: str
    saleDate: datetime
    totalAmount: float
    createdBy: str
    createdAt: datetime
    updatedAt: datetime
    items: List[SaleItemResponse] = []

    model_config = {
        "from_attributes": True
    }