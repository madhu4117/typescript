from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)

from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User

from app.schemas.inventory_forecast_schema import (
    InventoryForecastResponse,
    InventoryRecommendationResponse,
)

from app.services.inventory_forecast_service import (
    InventoryForecastService,
)

from app.utils.security import get_current_admin


router = APIRouter(
    prefix="/inventory",
    tags=["Inventory Forecast"],
)


# =========================================================
# FORECAST
# =========================================================

@router.get(
    "/forecast",
    response_model=InventoryForecastResponse,
)
def get_inventory_forecast(
    risk: Optional[str] = Query(
        default=None
    ),

    category_id: Optional[int] = Query(
        default=None
    ),

    product_id: Optional[int] = Query(
        default=None
    ),

    reorder_required: Optional[bool] = Query(
        default=None
    ),

    sort_by: str = Query(
        default="risk"
    ),

    sort_order: str = Query(
        default="desc"
    ),

    db: Session = Depends(get_db),

    admin: User = Depends(
        get_current_admin
    ),
):

    return (
        InventoryForecastService
        .get_forecast(
            db=db,
            company_id=admin.company_id,
            risk=risk,
            category_id=category_id,
            product_id=product_id,
            reorder_required=reorder_required,
            sort_by=sort_by,
            sort_order=sort_order,
        )
    )


# =========================================================
# RECOMMENDATIONS
# =========================================================

@router.get(
    "/recommendations",
    response_model=InventoryForecastResponse,
)
def get_inventory_recommendations(
    db: Session = Depends(get_db),

    admin: User = Depends(
        get_current_admin
    ),
):

    return (
        InventoryForecastService
        .get_forecast(
            db=db,
            company_id=admin.company_id,
            reorder_required=True,
            sort_by="recommendedQuantity",
            sort_order="desc",
        )
    )


# =========================================================
# SINGLE PRODUCT RECOMMENDATION
# =========================================================

@router.get(
    "/recommendations/{product_id}",
    response_model=InventoryRecommendationResponse,
)
def get_product_recommendation(
    product_id: int,

    db: Session = Depends(get_db),

    admin: User = Depends(
        get_current_admin
    ),
):

    result = (
        InventoryForecastService
        .get_product_recommendation(
            db=db,
            company_id=admin.company_id,
            product_id=product_id,
        )
    )

    if result is None:

        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    return {
        "product": result
    }


# =========================================================
# STOCK PROJECTION
# =========================================================

@router.get(
    "/forecast/{product_id}/projection"
)
def get_stock_projection(
    product_id: int,

    db: Session = Depends(get_db),

    admin: User = Depends(
        get_current_admin
    ),
):

    result = (
        InventoryForecastService
        .get_stock_projection(
            db=db,
            company_id=admin.company_id,
            product_id=product_id,
        )
    )

    if result is None:

        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    return result