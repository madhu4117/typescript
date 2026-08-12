from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.sale_schema import SaleCreate, SaleResponse
from app.services.sale_service import SaleService
from app.utils.security import get_current_admin

router = APIRouter(
    prefix="/sales",
    tags=["Sales"],
)


# --------------------------------------------------
# Get All Sales
# --------------------------------------------------
@router.get("/")
def get_sales(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return SaleService.get_sales(
        db=db,
        company_id=admin.company_id,
    )


# --------------------------------------------------
# Create Sale
# --------------------------------------------------
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

    performed_by = f"{admin.name} ({admin.email})"

    return SaleService.create_sale(
        db=db,
        sale_in=sale_in,
        company_id=admin.company_id,
        performed_by=performed_by,
    )