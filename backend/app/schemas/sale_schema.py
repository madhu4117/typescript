from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict


# =========================================================
# SALE ITEM
# =========================================================

class SaleItemBase(BaseModel):
    productId: int = Field(..., gt=0)
    categoryId: int = Field(..., gt=0)

    quantity: int = Field(
        ...,
        gt=0,
    )

    unitPrice: float = Field(
        ...,
        ge=0,
    )

    discount: float = Field(
        0,
        ge=0,
    )

    tax: float = Field(
        0,
        ge=0,
    )


class SaleItemCreate(SaleItemBase):
    pass


class SaleItemResponse(SaleItemBase):

    id: int

    total: float

    model_config = ConfigDict(
        from_attributes=True
    )


# =========================================================
# SALE BASE
# =========================================================

class SaleBase(BaseModel):

    customerId: int = Field(
        ...,
        gt=0,
    )

    salesChannel: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )

    paymentMethod: str = Field(
        ...,
        min_length=1,
        max_length=50,
    )

    discount: float = Field(
        0,
        ge=0,
    )

    tax: float = Field(
        0,
        ge=0,
    )

    notes: Optional[str] = Field(
        default=None,
        max_length=500,
    )


# =========================================================
# CREATE SALE
# =========================================================

class SaleCreate(SaleBase):

    items: List[SaleItemCreate] = Field(
        ...,
        min_length=1,
    )


# =========================================================
# UPDATE SALE
# =========================================================

class SaleUpdate(BaseModel):

    customerId: Optional[int] = Field(
        default=None,
        gt=0,
    )

    salesChannel: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    paymentMethod: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    discount: Optional[float] = Field(
        default=None,
        ge=0,
    )

    tax: Optional[float] = Field(
        default=None,
        ge=0,
    )

    notes: Optional[str] = Field(
        default=None,
        max_length=500,
    )

    status: Optional[str] = Field(
        default=None,
        max_length=30,
    )


# =========================================================
# SALE RESPONSE
# =========================================================

class SaleResponse(SaleBase):

    id: int

    companyId: int

    invoiceNumber: str

    customerName: str

    saleDate: datetime

    totalAmount: float

    status: str

    createdBy: str

    createdAt: datetime

    updatedAt: datetime

    items: List[SaleItemResponse] = []

    model_config = ConfigDict(
        from_attributes=True
    )