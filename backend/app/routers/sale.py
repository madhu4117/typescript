from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.user import User
from app.models.sale import Sale
from app.models.customer import Customer

from app.schemas.sale_schema import (
    SaleCreate,
    SaleResponse,
    SaleUpdate,
)

from app.services.sale_service import SaleService

from app.utils.security import get_current_admin


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/sales",
    tags=["Sales"],
)


# =========================================================
# GET ALL SALES
# =========================================================

@router.get(
    "/",
    response_model=list[SaleResponse],
)
def get_sales(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):

    return SaleService.get_sales(
        db=db,
        company_id=admin.company_id,
    )


# =========================================================
# GET SALE BY ID
# =========================================================

@router.get(
    "/{sale_id}",
    response_model=SaleResponse,
)
def get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):

    return SaleService.get_sale(
        db=db,
        sale_id=sale_id,
        company_id=admin.company_id,
    )


# =========================================================
# CREATE SALE
# =========================================================

@router.post(
    "/",
    response_model=SaleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_sale(
    sale_in: SaleCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):

    performed_by = (
        f"{admin.name} ({admin.email})"
    )

    return SaleService.create_sale(
        db=db,
        sale_in=sale_in,
        company_id=admin.company_id,
        performed_by=performed_by,
    )


# =========================================================
# UPDATE SALE
# =========================================================

@router.put(
    "/{sale_id}",
    response_model=SaleResponse,
)
def update_sale(
    sale_id: int,
    sale_in: SaleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):

    sale = (
        db.query(Sale)
        .filter(
            Sale.id == sale_id,
            Sale.companyId == admin.company_id,
        )
        .first()
    )

    if not sale:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sale not found",
        )

    update_data = sale_in.model_dump(
        exclude_unset=True
    )

    # =====================================================
    # CUSTOMER
    # =====================================================

    if "customerId" in update_data:

        customer = (
            db.query(Customer)
            .filter(
                Customer.id
                == update_data["customerId"],

                Customer.companyId
                == admin.company_id,
            )
            .first()
        )

        if not customer:

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found",
            )

        sale.customerId = customer.id

        sale.customerName = (
            f"{customer.firstName} "
            f"{customer.lastName}"
        )

    # =====================================================
    # SALES CHANNEL
    # =====================================================

    if "salesChannel" in update_data:

        sale.salesChannel = (
            update_data["salesChannel"]
        )

    # =====================================================
    # PAYMENT METHOD
    # =====================================================

    if "paymentMethod" in update_data:

        sale.paymentMethod = (
            update_data["paymentMethod"]
        )

    # =====================================================
    # DISCOUNT
    # =====================================================

    if "discount" in update_data:

        sale.discount = float(
            update_data["discount"]
        )

    # =====================================================
    # TAX
    # =====================================================

    if "tax" in update_data:

        sale.tax = float(
            update_data["tax"]
        )

    # =====================================================
    # NOTES
    # =====================================================

    if "notes" in update_data:

        sale.notes = update_data["notes"]

    # =====================================================
    # STATUS
    # =====================================================

    if "status" in update_data:

        sale.status = update_data["status"]

    # =====================================================
    # RECALCULATE
    # =====================================================

    items_total = 0

    for item in sale.sale_items:

        line_total = (
            float(item.unitPrice)
            * int(item.quantity)
            - float(item.discount or 0)
            + float(item.tax or 0)
        )

        if line_total < 0:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Item {item.id} "
                    "cannot have a negative total"
                ),
            )

        item.total = line_total

        items_total += line_total

    total_amount = (
        items_total
        - float(sale.discount or 0)
        + float(sale.tax or 0)
    )

    if total_amount < 0:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sale total cannot be negative",
        )

    sale.totalAmount = total_amount

    # =====================================================
    # SAVE
    # =====================================================

    try:

        db.commit()

        db.refresh(sale)

        return sale

    except Exception as exc:

        db.rollback()

        print(
            "UPDATE SALE ERROR:",
            repr(exc),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update sale",
        )


# =========================================================
# DELETE SALE
# =========================================================

@router.delete(
    "/{sale_id}",
)
def delete_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):

    performed_by = (
        f"{admin.name} ({admin.email})"
    )

    return SaleService.delete_sale(
        db=db,
        sale_id=sale_id,
        company_id=admin.company_id,
        performed_by=performed_by,
    )