from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Query,
)

from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.customer import (
    Customer,
    CustomerStatus,
    CustomerSegment,
)

from app.schemas.customer import (
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
)

from app.utils.security import get_current_user


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/customers",
    tags=["Customers"],
)


# =========================================================
# CREATE CUSTOMER
# =========================================================

@router.post(
    "/",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_customer(
    request: CustomerCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    company_id = current_user.company_id

    # =====================================================
    # DUPLICATE EMAIL
    # =====================================================

    existing_email = (
        db.query(Customer)
        .filter(
            Customer.companyId == company_id,
            Customer.email == str(request.email),
        )
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customer with this email already exists",
        )

    # =====================================================
    # DUPLICATE PHONE
    # =====================================================

    existing_phone = (
        db.query(Customer)
        .filter(
            Customer.companyId == company_id,
            Customer.phone == request.phone,
        )
        .first()
    )

    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customer with this phone number already exists",
        )

    # =====================================================
    # CREATE CUSTOMER
    # =====================================================

    customer = Customer(
        companyId=company_id,

        firstName=request.firstName,
        lastName=request.lastName,

        email=str(request.email),
        phone=request.phone,

        dateOfBirth=request.dateOfBirth,
        gender=request.gender,

        address=request.address,
        city=request.city,
        state=request.state,
        country=request.country,
        postalCode=request.postalCode,

        customerType=request.customerType,
        customerSegment=request.customerSegment,

        preferredSalesChannel=request.preferredSalesChannel,

        status=CustomerStatus.ACTIVE,
    )

    db.add(customer)

    try:
        db.commit()
        db.refresh(customer)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customer with this email or phone number already exists",
        )

    return customer


# =========================================================
# GET ALL CUSTOMERS
# SEARCH + STATUS + SEGMENT FILTER
# =========================================================

@router.get(
    "/",
    response_model=list[CustomerResponse],
)
def get_customers(
    search: Optional[str] = Query(
        default=None,
        description="Search by first name, last name, or email",
    ),

    status_filter: Optional[CustomerStatus] = Query(
        default=None,
        alias="status",
        description="Filter by Active or Inactive",
    ),

    segment: Optional[CustomerSegment] = Query(
        default=None,
        description="Filter by New, Regular, Loyal, or VIP",
    ),

    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    company_id = current_user.company_id

    # =====================================================
    # BASE QUERY
    # =====================================================

    query = (
        db.query(Customer)
        .filter(
            Customer.companyId == company_id
        )
    )

    # =====================================================
    # SEARCH
    # =====================================================

    if search:

        search_value = f"%{search.strip()}%"

        query = query.filter(
            or_(
                Customer.firstName.ilike(search_value),
                Customer.lastName.ilike(search_value),
                Customer.email.ilike(search_value),
            )
        )

    # =====================================================
    # STATUS FILTER
    # =====================================================

    if status_filter:

        query = query.filter(
            Customer.status == status_filter
        )

    # =====================================================
    # SEGMENT FILTER
    # =====================================================

    if segment:

        query = query.filter(
            Customer.customerSegment == segment
        )

    # =====================================================
    # GET CUSTOMERS
    # =====================================================

    customers = (
        query
        .order_by(
            Customer.createdAt.desc()
        )
        .all()
    )

    return customers


# =========================================================
# GET CUSTOMER BY ID
# =========================================================

@router.get(
    "/{customer_id}",
    response_model=CustomerResponse,
)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    company_id = current_user.company_id

    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id,
            Customer.companyId == company_id,
        )
        .first()
    )

    if not customer:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )

    return customer


# =========================================================
# UPDATE CUSTOMER
# =========================================================

@router.put(
    "/{customer_id}",
    response_model=CustomerResponse,
)
def update_customer(
    customer_id: int,
    request: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    company_id = current_user.company_id

    # =====================================================
    # FIND CUSTOMER
    # =====================================================

    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id,
            Customer.companyId == company_id,
        )
        .first()
    )

    if not customer:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )

    # =====================================================
    # DUPLICATE EMAIL
    # =====================================================

    if request.email is not None:

        existing_email = (
            db.query(Customer)
            .filter(
                Customer.companyId == company_id,
                Customer.email == str(request.email),
                Customer.id != customer_id,
            )
            .first()
        )

        if existing_email:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Customer with this email already exists",
            )

    # =====================================================
    # DUPLICATE PHONE
    # =====================================================

    if request.phone is not None:

        existing_phone = (
            db.query(Customer)
            .filter(
                Customer.companyId == company_id,
                Customer.phone == request.phone,
                Customer.id != customer_id,
            )
            .first()
        )

        if existing_phone:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Customer with this phone number already exists",
            )

    # =====================================================
    # UPDATE SUPPLIED FIELDS
    # =====================================================

    update_data = request.model_dump(
        exclude_unset=True
    )

    if "email" in update_data:

        update_data["email"] = str(
            update_data["email"]
        )

    for field, value in update_data.items():

        setattr(
            customer,
            field,
            value,
        )

    # =====================================================
    # SAVE
    # =====================================================

    try:

        db.commit()
        db.refresh(customer)

    except IntegrityError:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customer with this email or phone number already exists",
        )

    return customer


# =========================================================
# SOFT DELETE CUSTOMER
# =========================================================

@router.delete(
    "/{customer_id}",
)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    company_id = current_user.company_id

    # =====================================================
    # FIND CUSTOMER
    # =====================================================

    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id,
            Customer.companyId == company_id,
        )
        .first()
    )

    if not customer:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )

    # =====================================================
    # SOFT DELETE
    # =====================================================

    customer.status = CustomerStatus.INACTIVE

    try:

        db.commit()
        db.refresh(customer)

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to deactivate customer",
        )

    return {
        "message": "Customer deactivated successfully",
        "customerId": customer.id,
        "status": customer.status.value,
    }


# =========================================================
# ACTIVATE CUSTOMER
# =========================================================

@router.patch(
    "/{customer_id}/activate",
    response_model=CustomerResponse,
)
def activate_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    company_id = current_user.company_id

    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id,
            Customer.companyId == company_id,
        )
        .first()
    )

    if not customer:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )

    customer.status = CustomerStatus.ACTIVE

    try:

        db.commit()
        db.refresh(customer)

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to activate customer",
        )

    return customer


# =========================================================
# DEACTIVATE CUSTOMER
# =========================================================

@router.patch(
    "/{customer_id}/deactivate",
    response_model=CustomerResponse,
)
def deactivate_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    company_id = current_user.company_id

    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id,
            Customer.companyId == company_id,
        )
        .first()
    )

    if not customer:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found",
        )

    customer.status = CustomerStatus.INACTIVE

    try:

        db.commit()
        db.refresh(customer)

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to deactivate customer",
        )

    return customer