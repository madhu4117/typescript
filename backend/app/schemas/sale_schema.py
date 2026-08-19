from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# SALE ITEM CREATE
# ============================================================

class SaleItemCreate(BaseModel):
    productId: int = Field(gt=0)
    categoryId: int = Field(gt=0)

    quantity: int = Field(gt=0)

    unitPrice: float = Field(ge=0)

    discount: float = Field(
        default=0,
        ge=0,
    )

    tax: float = Field(
        default=0,
        ge=0,
    )


# ============================================================
# SALE ITEM RESPONSE
# ============================================================

class SaleItemResponse(BaseModel):
    id: int

    productId: int
    categoryId: int

    quantity: int

    unitPrice: float
    discount: float
    tax: float

    total: float

    productName: Optional[str] = None
    categoryName: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# SALE CREATE
# ============================================================

class SaleCreate(BaseModel):
    customerId: int = Field(gt=0)

    salesChannel: str = Field(
        min_length=1,
        max_length=100,
    )

    paymentMethod: str = Field(
        min_length=1,
        max_length=100,
    )

    discount: float = Field(
        default=0,
        ge=0,
    )

    tax: float = Field(
        default=0,
        ge=0,
    )

    notes: Optional[str] = None

    items: list[SaleItemCreate] = Field(
        min_length=1
    )


# ============================================================
# SALE UPDATE
# ============================================================

class SaleUpdate(BaseModel):
    customerId: Optional[int] = Field(
        default=None,
        gt=0,
    )

    salesChannel: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    paymentMethod: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    discount: Optional[float] = Field(
        default=None,
        ge=0,
    )

    tax: Optional[float] = Field(
        default=None,
        ge=0,
    )

    notes: Optional[str] = None

    status: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=50,
    )


# ============================================================
# SALE RESPONSE
# ============================================================

class SaleResponse(BaseModel):
    id: int

    companyId: int

    customerId: int

    customerName: str

    invoiceNumber: str

    saleDate: datetime

    salesChannel: str

    paymentMethod: str

    discount: float

    tax: float

    totalAmount: float

    status: str

    notes: Optional[str] = None

    createdBy: str

    createdAt: datetime

    updatedAt: datetime

    items: list[SaleItemResponse] = []

    model_config = ConfigDict(
        from_attributes=True
    )