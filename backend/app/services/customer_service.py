from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.customer import Customer, CustomerStatus
from app.schemas.customer_schema import CustomerCreate, CustomerUpdate
from app.services.audit_service import log_event


class CustomerService:

    # =========================================================
    # GET ALL CUSTOMERS
    # =========================================================

    @staticmethod
    def get_customers(
        db: Session,
        company_id: int,
        search: Optional[str] = None,
        status_filter: Optional[str] = None,
        segment: Optional[str] = None,
    ) -> List[Customer]:

        query = (
            db.query(Customer)
            .filter(Customer.companyId == company_id)
        )

        if search:
            keyword = f"%{search.strip()}%"

            query = query.filter(
                (Customer.firstName.ilike(keyword))
                | (Customer.lastName.ilike(keyword))
                | (Customer.email.ilike(keyword))
            )

        if status_filter:
            query = query.filter(
                Customer.status == status_filter
            )

        if segment:
            query = query.filter(
                Customer.customerSegment == segment
            )

        return (
            query
            .order_by(Customer.id.desc())
            .all()
        )

    # =========================================================
    # GET CUSTOMER
    # =========================================================

    @staticmethod
    def get_customer(
        db: Session,
        customer_id: int,
        company_id: int,
    ) -> Customer:

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
    # CREATE CUSTOMER
    # =========================================================

    @staticmethod
    def create_customer(
        db: Session,
        customer_in: CustomerCreate,
        company_id: int,
        performed_by: str,
    ) -> Customer:

        # -----------------------------------------------------
        # Check duplicate email
        # -----------------------------------------------------

        existing_email = (
            db.query(Customer)
            .filter(
                Customer.companyId == company_id,
                Customer.email == str(customer_in.email),
            )
            .first()
        )

        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Customer with this email already exists",
            )

        # -----------------------------------------------------
        # Check duplicate phone
        # -----------------------------------------------------

        existing_phone = (
            db.query(Customer)
            .filter(
                Customer.companyId == company_id,
                Customer.phone == customer_in.phone.strip(),
            )
            .first()
        )

        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Customer with this phone number already exists",
            )

        # -----------------------------------------------------
        # Create customer
        # -----------------------------------------------------

        customer = Customer(
            companyId=company_id,

            firstName=customer_in.firstName.strip(),
            lastName=customer_in.lastName.strip(),

            email=str(customer_in.email).lower().strip(),
            phone=customer_in.phone.strip(),

            dateOfBirth=customer_in.dateOfBirth,
            gender=customer_in.gender,

            address=customer_in.address.strip(),
            city=customer_in.city.strip(),
            state=customer_in.state.strip(),
            country=customer_in.country.strip(),
            postalCode=customer_in.postalCode.strip(),

            customerType=customer_in.customerType,
            customerSegment=customer_in.customerSegment,
            preferredSalesChannel=customer_in.preferredSalesChannel,

            status=CustomerStatus.ACTIVE,
        )

        db.add(customer)
        db.commit()
        db.refresh(customer)

        # -----------------------------------------------------
        # Audit
        # -----------------------------------------------------

        log_event(
            db=db,
            company_id=company_id,
            target_name=f"{customer.firstName} {customer.lastName}",
            action="Customer Created",
            performed_by=performed_by,
        )

        return customer

    # =========================================================
    # UPDATE CUSTOMER
    # =========================================================

    @staticmethod
    def update_customer(
        db: Session,
        customer_id: int,
        customer_in: CustomerUpdate,
        company_id: int,
        performed_by: str,
    ) -> Customer:

        customer = CustomerService.get_customer(
            db=db,
            customer_id=customer_id,
            company_id=company_id,
        )

        # -----------------------------------------------------
        # Duplicate email
        # -----------------------------------------------------

        if customer_in.email is not None:

            email = str(customer_in.email).lower().strip()

            existing_email = (
                db.query(Customer)
                .filter(
                    Customer.companyId == company_id,
                    Customer.email == email,
                    Customer.id != customer_id,
                )
                .first()
            )

            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Customer with this email already exists",
                )

        # -----------------------------------------------------
        # Duplicate phone
        # -----------------------------------------------------

        if customer_in.phone is not None:

            phone = customer_in.phone.strip()

            existing_phone = (
                db.query(Customer)
                .filter(
                    Customer.companyId == company_id,
                    Customer.phone == phone,
                    Customer.id != customer_id,
                )
                .first()
            )

            if existing_phone:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Customer with this phone number already exists",
                )

        # -----------------------------------------------------
        # Update fields
        # -----------------------------------------------------

        update_data = customer_in.model_dump(
            exclude_unset=True
        )

        for key, value in update_data.items():

            if key in [
                "firstName",
                "lastName",
                "phone",
                "address",
                "city",
                "state",
                "country",
                "postalCode",
            ]:
                if isinstance(value, str):
                    value = value.strip()

            if key == "email" and value:
                value = str(value).lower().strip()

            setattr(customer, key, value)

        db.commit()
        db.refresh(customer)

        # -----------------------------------------------------
        # Audit
        # -----------------------------------------------------

        log_event(
            db=db,
            company_id=company_id,
            target_name=f"{customer.firstName} {customer.lastName}",
            action="Customer Updated",
            performed_by=performed_by,
        )

        return customer

    # =========================================================
    # SOFT DELETE
    # =========================================================

    @staticmethod
    def delete_customer(
        db: Session,
        customer_id: int,
        company_id: int,
        performed_by: str,
    ) -> Customer:

        customer = CustomerService.get_customer(
            db=db,
            customer_id=customer_id,
            company_id=company_id,
        )

        customer.status = CustomerStatus.INACTIVE

        db.commit()
        db.refresh(customer)

        # -----------------------------------------------------
        # Audit
        # -----------------------------------------------------

        log_event(
            db=db,
            company_id=company_id,
            target_name=f"{customer.firstName} {customer.lastName}",
            action="Customer Deactivated",
            performed_by=performed_by,
        )

        return customer

    # =========================================================
    # ACTIVATE CUSTOMER
    # =========================================================

    @staticmethod
    def activate_customer(
        db: Session,
        customer_id: int,
        company_id: int,
        performed_by: str,
    ) -> Customer:

        customer = CustomerService.get_customer(
            db=db,
            customer_id=customer_id,
            company_id=company_id,
        )

        customer.status = CustomerStatus.ACTIVE

        db.commit()
        db.refresh(customer)

        log_event(
            db=db,
            company_id=company_id,
            target_name=f"{customer.firstName} {customer.lastName}",
            action="Customer Activated",
            performed_by=performed_by,
        )

        return customer