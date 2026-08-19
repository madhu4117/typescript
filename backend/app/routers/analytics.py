from datetime import date
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    Query,
)
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.schemas.analytics_schema import DashboardSummary
from app.services.analytics_service import AnalyticsService
from app.services.audit_service import log_event
from app.utils.csv_export import export_csv
from app.utils.pdf_export import export_pdf
from app.utils.security import get_current_admin


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


# =========================================================
# COMMON FILTERS
# =========================================================

def analytics_filters(
    start_date: Optional[date] = Query(
        default=None,
        description="Start date YYYY-MM-DD",
    ),
    end_date: Optional[date] = Query(
        default=None,
        description="End date YYYY-MM-DD",
    ),
):
    if start_date and end_date:
        if start_date > end_date:
            from fastapi import HTTPException

            raise HTTPException(
                status_code=400,
                detail="Start date cannot be after end date",
            )

    return {
        "start_date": start_date,
        "end_date": end_date,
    }


# =========================================================
# DASHBOARD SUMMARY
# =========================================================

@router.get(
    "/summary",
    response_model=DashboardSummary,
)
def dashboard_summary(
    filters: dict = Depends(analytics_filters),
    product_id: Optional[int] = Query(
        default=None
    ),
    category_id: Optional[int] = Query(
        default=None
    ),
    customer_id: Optional[int] = Query(
        default=None
    ),
    payment_method: Optional[str] = Query(
        default=None
    ),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):

    result = AnalyticsService.get_dashboard_summary(
        db=db,
        company_id=admin.company_id,
        start_date=filters["start_date"],
        end_date=filters["end_date"],
        product_id=product_id,
        category_id=category_id,
        customer_id=customer_id,
        payment_method=payment_method,
    )

    return result


# =========================================================
# REVENUE TREND
# =========================================================

@router.get(
    "/revenue-trend"
)
def revenue_trend(
    period: str = Query(
        default="daily",
        pattern="^(daily|weekly|monthly)$",
    ),
    filters: dict = Depends(analytics_filters),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):

    return AnalyticsService.revenue_trend(
        db=db,
        company_id=admin.company_id,
        period=period,
        start_date=filters["start_date"],
        end_date=filters["end_date"],
    )


# =========================================================
# TOP PRODUCTS
# =========================================================

@router.get(
    "/top-products"
)
def top_products(
    sort_by: str = Query(
        default="revenue",
        pattern="^(revenue|quantity)$",
    ),
    limit: int = Query(
        default=10,
        ge=1,
        le=100,
    ),
    filters: dict = Depends(analytics_filters),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):

    return AnalyticsService.top_products(
        db=db,
        company_id=admin.company_id,
        start_date=filters["start_date"],
        end_date=filters["end_date"],
        sort_by=sort_by,
        limit=limit,
    )


# =========================================================
# CATEGORY SALES
# =========================================================

@router.get(
    "/category-sales"
)
def category_sales(
    filters: dict = Depends(analytics_filters),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):

    return AnalyticsService.category_sales(
        db=db,
        company_id=admin.company_id,
        start_date=filters["start_date"],
        end_date=filters["end_date"],
    )


# =========================================================
# CUSTOMER REVENUE
# =========================================================

@router.get(
    "/customers"
)
def customer_revenue(
    limit: int = Query(
        default=10,
        ge=1,
        le=100,
    ),
    filters: dict = Depends(analytics_filters),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):

    return AnalyticsService.customer_revenue(
        db=db,
        company_id=admin.company_id,
        start_date=filters["start_date"],
        end_date=filters["end_date"],
        limit=limit,
    )


# =========================================================
# PAYMENT METHODS
# =========================================================

@router.get(
    "/payment-methods"
)
def payment_methods(
    filters: dict = Depends(analytics_filters),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):

    return AnalyticsService.payment_method_summary(
        db=db,
        company_id=admin.company_id,
        start_date=filters["start_date"],
        end_date=filters["end_date"],
    )


# =========================================================
# SALES CHANNEL
# =========================================================

@router.get(
    "/sales-channel"
)
def sales_channel(
    filters: dict = Depends(analytics_filters),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):

    return AnalyticsService.sales_channel_summary(
        db=db,
        company_id=admin.company_id,
        start_date=filters["start_date"],
        end_date=filters["end_date"],
    )


# =========================================================
# INVENTORY STATUS
# =========================================================

@router.get(
    "/inventory-status"
)
def inventory_status(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):

    return AnalyticsService.inventory_status(
        db=db,
        company_id=admin.company_id,
    )


# =========================================================
# LOW STOCK PRODUCTS
# =========================================================

@router.get(
    "/low-stock-products"
)
def low_stock_products(
    threshold: int = Query(
        default=10,
        ge=0,
        le=10000,
    ),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):

    return AnalyticsService.low_stock_products(
        db=db,
        company_id=admin.company_id,
        threshold=threshold,
    )


# =========================================================
# OUT OF STOCK PRODUCTS
# =========================================================

@router.get(
    "/out-of-stock-products"
)
def out_of_stock_products(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):

    return AnalyticsService.out_of_stock_products(
        db=db,
        company_id=admin.company_id,
    )


# =========================================================
# INVENTORY VALUE
# =========================================================

@router.get(
    "/inventory-value"
)
def inventory_value(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):

    return AnalyticsService.inventory_value_by_category(
        db=db,
        company_id=admin.company_id,
    )


# =========================================================
# CSV EXPORT
# =========================================================

@router.get(
    "/export/csv"
)
def export_dashboard_csv(
    filters: dict = Depends(analytics_filters),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):

    summary = AnalyticsService.get_dashboard_summary(
        db=db,
        company_id=admin.company_id,
        start_date=filters["start_date"],
        end_date=filters["end_date"],
    )

    csv_data = export_csv(
        [summary]
    )

    log_event(
        db=db,
        company_id=admin.company_id,
        target_name="Analytics Dashboard",
        action="Export CSV",
        performed_by=(
            f"{admin.name} "
            f"({admin.email})"
        ),
    )

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition":
                "attachment; "
                "filename=sales_analytics.csv"
        },
    )


# =========================================================
# PDF EXPORT
# =========================================================

@router.get(
    "/export/pdf"
)
def export_dashboard_pdf(
    filters: dict = Depends(analytics_filters),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):

    summary = AnalyticsService.get_dashboard_summary(
        db=db,
        company_id=admin.company_id,
        start_date=filters["start_date"],
        end_date=filters["end_date"],
    )

    pdf = export_pdf(
        summary
    )

    log_event(
        db=db,
        company_id=admin.company_id,
        target_name="Analytics Dashboard",
        action="Export PDF",
        performed_by=(
            f"{admin.name} "
            f"({admin.email})"
        ),
    )

    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                "attachment; "
                "filename=sales_analytics.pdf"
        },
    )