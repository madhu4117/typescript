from datetime import date, datetime
from typing import Optional

from pydantic import (
    BaseModel,
    EmailStr,
    ConfigDict,
    Field,
    field_validator,
)

from app.models.customer import (
    CustomerType,
    CustomerStatus,
    CustomerGender,
    CustomerSegment,
)


# =========================================================
# COMMON VALIDATORS
# =========================================================

def validate_required_string(value: str, field_name: str) -> str:

    value = value.strip()

    if not value:
        raise ValueError(
            f"{field_name} is required"
        )

    return value


def validate_phone_number(value: str) -> str:

    value = value.strip()

    if not value:
        raise ValueError(
            "Phone number is required"
        )

    if not value.isdigit():
        raise ValueError(
            "Phone number must contain only digits"
        )

    if len(value) < 10 or len(value) > 15:
        raise ValueError(
            "Phone number must contain between 10 and 15 digits"
        )

    return value


# =========================================================
# CREATE CUSTOMER
# =========================================================

class CustomerCreate(BaseModel):

    firstName: str = Field(..., min_length=1, max_length=100)

    lastName: str = Field(..., min_length=1, max_length=100)

    email: EmailStr

    phone: str

    address: str = Field(..., min_length=1, max_length=255)

    city: str = Field(..., min_length=1, max_length=100)

    state: str = Field(..., min_length=1, max_length=100)

    country: str = Field(..., min_length=1, max_length=100)

    postalCode: str = Field(..., min_length=1, max_length=20)

    dateOfBirth: Optional[date] = None

    gender: Optional[CustomerGender] = None

    customerType: CustomerType = CustomerType.RETAIL

    customerSegment: CustomerSegment = CustomerSegment.NEW

    preferredSalesChannel: Optional[str] = None

    # -----------------------------------------------------
    # Name validation
    # -----------------------------------------------------

    @field_validator("firstName")
    @classmethod
    def validate_first_name(cls, value: str):

        return validate_required_string(
            value,
            "First name",
        )

    @field_validator("lastName")
    @classmethod
    def validate_last_name(cls, value: str):

        return validate_required_string(
            value,
            "Last name",
        )

    # -----------------------------------------------------
    # Phone validation
    # -----------------------------------------------------

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str):

        return validate_phone_number(value)

    # -----------------------------------------------------
    # Address validation
    # -----------------------------------------------------

    @field_validator(
        "address",
        "city",
        "state",
        "country",
        "postalCode",
    )
    @classmethod
    def validate_address_fields(cls, value: str):

        return value.strip()


# =========================================================
# UPDATE CUSTOMER
# =========================================================

class CustomerUpdate(BaseModel):

    firstName: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
    )

    lastName: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
    )

    email: Optional[EmailStr] = None

    phone: Optional[str] = None

    address: Optional[str] = Field(
        None,
        min_length=1,
        max_length=255,
    )

    city: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
    )

    state: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
    )

    country: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
    )

    postalCode: Optional[str] = Field(
        None,
        min_length=1,
        max_length=20,
    )

    dateOfBirth: Optional[date] = None

    gender: Optional[CustomerGender] = None

    customerType: Optional[CustomerType] = None

    customerSegment: Optional[CustomerSegment] = None

    preferredSalesChannel: Optional[str] = None

    status: Optional[CustomerStatus] = None

    # -----------------------------------------------------
    # Name validation
    # -----------------------------------------------------

    @field_validator("firstName")
    @classmethod
    def validate_first_name(cls, value):

        if value is None:
            return value

        return validate_required_string(
            value,
            "First name",
        )

    @field_validator("lastName")
    @classmethod
    def validate_last_name(cls, value):

        if value is None:
            return value

        return validate_required_string(
            value,
            "Last name",
        )

    # -----------------------------------------------------
    # Phone validation
    # -----------------------------------------------------

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value):

        if value is None:
            return value

        return validate_phone_number(value)


# =========================================================
# CUSTOMER RESPONSE
# =========================================================

class CustomerResponse(BaseModel):

    id: int

    companyId: int

    firstName: str

    lastName: str

    email: EmailStr

    phone: str

    address: str

    city: str

    state: str

    country: str

    postalCode: str

    dateOfBirth: Optional[date] = None

    gender: Optional[CustomerGender] = None

    customerType: CustomerType

    customerSegment: CustomerSegment

    preferredSalesChannel: Optional[str] = None

    status: CustomerStatus

    createdAt: datetime

    updatedAt: datetime

    model_config = ConfigDict(
        from_attributes=True
    )