from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.models.sale import Sale
from app.schemas.sale_schema import (
    SaleCreate,
    SaleResponse,
    SaleUpdate,
)
from app.services.sale_service import SaleService
from app.utils.security import get_current_admin


router = APIRouter(
    prefix="/sales",
    tags=["Sales"],
)


# ============================================================
# GET ALL SALES
# ============================================================

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


# ============================================================
# GET SALE BY ID
# ============================================================

@router.get(
    "/{sale_id}",
    response_model=SaleResponse,
)
def get_sale(
    sale_id: int,
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

    return sale


# ============================================================
# CREATE SALE
# ============================================================

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


# ============================================================
# UPDATE SALE
# ============================================================

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

    # --------------------------------------------------------
    # Update customer
    # --------------------------------------------------------

    if "customerId" in update_data:

        customer = (
            db.query(SaleService.Customer)
            .filter(
                SaleService.Customer.id
                == update_data["customerId"],

                SaleService.Customer.companyId
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

    # --------------------------------------------------------
    # Other fields
    # --------------------------------------------------------

    if "salesChannel" in update_data:
        sale.salesChannel = update_data[
            "salesChannel"
        ]

    if "paymentMethod" in update_data:
        sale.paymentMethod = update_data[
            "paymentMethod"
        ]

    db.commit()
    db.refresh(sale)

    return sale


# ============================================================
# DELETE SALE
# ============================================================

@router.delete(
    "/{sale_id}",
)
def delete_sale(
    sale_id: int,
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

    db.delete(sale)
    db.commit()

    return {
        "message": "Sale deleted successfully",
        "saleId": sale_id,
    }