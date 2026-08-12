import enum

from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    Enum,
    UniqueConstraint,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.database import Base


# =========================================================
# CUSTOMER TYPE
# =========================================================

class CustomerType(str, enum.Enum):
    RETAIL = "Retail"
    WHOLESALE = "Wholesale"
    CORPORATE = "Corporate"


# =========================================================
# CUSTOMER STATUS
# =========================================================

class CustomerStatus(str, enum.Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"


# =========================================================
# CUSTOMER GENDER
# =========================================================

class CustomerGender(str, enum.Enum):
    MALE = "Male"
    FEMALE = "Female"
    OTHER = "Other"


# =========================================================
# CUSTOMER SEGMENT
# =========================================================

class CustomerSegment(str, enum.Enum):
    NEW = "New"
    REGULAR = "Regular"
    LOYAL = "Loyal"
    VIP = "VIP"


# =========================================================
# CUSTOMER MODEL
# =========================================================

class Customer(Base):

    __tablename__ = "customers"

    __table_args__ = (
        UniqueConstraint(
            "companyId",
            "email",
            name="uq_customer_company_email",
        ),
        UniqueConstraint(
            "companyId",
            "phone",
            name="uq_customer_company_phone",
        ),
    )

    # =====================================================
    # PRIMARY KEY
    # =====================================================

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # =====================================================
    # COMPANY
    # =====================================================

    companyId = Column(
        "companyId",
        Integer,
        nullable=False,
        index=True,
    )

    # =====================================================
    # CUSTOMER INFORMATION
    # =====================================================

    firstName = Column(
        "firstName",
        String(100),
        nullable=False,
    )

    lastName = Column(
        "lastName",
        String(100),
        nullable=False,
    )

    email = Column(
        String(150),
        nullable=False,
    )

    phone = Column(
        String(20),
        nullable=False,
    )

    dateOfBirth = Column(
        "dateOfBirth",
        Date,
        nullable=True,
    )

    gender = Column(
        Enum(CustomerGender),
        nullable=True,
    )

    # =====================================================
    # ADDRESS
    # =====================================================

    address = Column(
        String(255),
        nullable=False,
    )

    city = Column(
        String(100),
        nullable=False,
    )

    state = Column(
        String(100),
        nullable=False,
    )

    country = Column(
        String(100),
        nullable=False,
    )

    postalCode = Column(
        "postalCode",
        String(20),
        nullable=False,
    )

    # =====================================================
    # CUSTOMER BUSINESS INFORMATION
    # =====================================================

    customerType = Column(
        "customerType",
        Enum(CustomerType),
        nullable=False,
        default=CustomerType.RETAIL,
    )

    customerSegment = Column(
        "customerSegment",
        Enum(CustomerSegment),
        nullable=False,
        default=CustomerSegment.NEW,
    )

    preferredSalesChannel = Column(
        "preferredSalesChannel",
        String(50),
        nullable=True,
    )

    status = Column(
        Enum(CustomerStatus),
        nullable=False,
        default=CustomerStatus.ACTIVE,
    )

    # =====================================================
    # REGISTRATION
    # =====================================================

    createdAt = Column(
        "createdAt",
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updatedAt = Column(
        "updatedAt",
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # =====================================================
    # RELATIONSHIP WITH SALES
    # =====================================================

    sales = relationship(
        "Sale",
        back_populates="customer",
    )

    # =====================================================
    # PURCHASE SUMMARY
    # =====================================================

    purchase_summary = relationship(
        "CustomerPurchaseSummary",
        back_populates="customer",
        uselist=False,
        cascade="all, delete-orphan",
    )