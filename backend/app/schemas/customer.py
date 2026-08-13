from datetime import date, datetime
from typing import Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
)

from app.models.customer import (
    CustomerGender,
    CustomerType,
    CustomerSegment,
    CustomerStatus,
)


# =========================================================
# BASE CUSTOMER SCHEMA
# =========================================================

class CustomerBase(BaseModel):

    # =====================================================
    # CUSTOMER INFORMATION
    # =====================================================

    firstName: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    lastName: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    email: EmailStr

    phone: str = Field(
        ...,
        min_length=1,
        max_length=20,
    )

    dateOfBirth: Optional[date] = None

    gender: Optional[CustomerGender] = None

    # =====================================================
    # ADDRESS
    # =====================================================

    address: str = Field(
        ...,
        min_length=1,
        max_length=255,
    )

    city: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    state: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    country: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    postalCode: str = Field(
        ...,
        min_length=1,
        max_length=20,
    )

    # =====================================================
    # CUSTOMER BUSINESS INFORMATION
    # =====================================================

    customerType: CustomerType = CustomerType.RETAIL

    customerSegment: CustomerSegment = CustomerSegment.NEW

    preferredSalesChannel: Optional[str] = Field(
        default=None,
        max_length=50,
    )


# =========================================================
# CREATE CUSTOMER
# =========================================================

class CustomerCreate(CustomerBase):
    pass


# =========================================================
# UPDATE CUSTOMER
# =========================================================

class CustomerUpdate(BaseModel):

    # =====================================================
    # CUSTOMER INFORMATION
    # =====================================================

    firstName: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    lastName: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    email: Optional[EmailStr] = None

    phone: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=20,
    )

    dateOfBirth: Optional[date] = None

    gender: Optional[CustomerGender] = None

    # =====================================================
    # ADDRESS
    # =====================================================

    address: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    city: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    state: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    country: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    postalCode: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=20,
    )

    # =====================================================
    # BUSINESS INFORMATION
    # =====================================================

    customerType: Optional[CustomerType] = None

    customerSegment: Optional[CustomerSegment] = None

    preferredSalesChannel: Optional[str] = Field(
        default=None,
        max_length=50,
    )

    status: Optional[CustomerStatus] = None


# =========================================================
# CUSTOMER RESPONSE
# =========================================================

class CustomerResponse(CustomerBase):

    # =====================================================
    # PRIMARY KEY
    # =====================================================

    id: int

    # =====================================================
    # COMPANY
    # =====================================================

    companyId: int

    # =====================================================
    # STATUS
    # =====================================================

    status: CustomerStatus

    # =====================================================
    # TIMESTAMPS
    # =====================================================

    createdAt: datetime

    updatedAt: datetime

    # =====================================================
    # PYDANTIC ORM SUPPORT
    # =====================================================

    model_config = ConfigDict(
        from_attributes=True
    )