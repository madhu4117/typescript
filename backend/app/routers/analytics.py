from fastapi import APIRouter, Depends
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


# ----------------------------------------
# Dashboard Summary
# ----------------------------------------
@router.get(
    "/summary",
    response_model=DashboardSummary,
)
def dashboard_summary(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):

    summary = AnalyticsService.get_dashboard_summary(
        db=db,
        company_id=admin.company_id,
    )

    log_event(
        db=db,
        company_id=admin.company_id,
        target_name="Analytics Dashboard",
        action="Viewed Dashboard",
        performed_by=f"{admin.name} ({admin.email})",
    )

    return summary


# ----------------------------------------
# Revenue Trend
# ----------------------------------------
@router.get("/revenue-trend")
def revenue_trend(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return AnalyticsService.revenue_trend(
        db=db,
        company_id=admin.company_id,
    )


# ----------------------------------------
# Top Products
# ----------------------------------------
@router.get("/top-products")
def top_products(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return AnalyticsService.top_products(
        db=db,
        company_id=admin.company_id,
    )


# ----------------------------------------
# Category Sales
# ----------------------------------------
@router.get("/category-sales")
def category_sales(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return AnalyticsService.category_sales(
        db=db,
        company_id=admin.company_id,
    )


# ----------------------------------------
# Payment Method Summary
# ----------------------------------------
@router.get("/payment-methods")
def payment_methods(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return AnalyticsService.payment_method_summary(
        db=db,
        company_id=admin.company_id,
    )


# ----------------------------------------
# Sales Channel Summary
# ----------------------------------------
@router.get("/sales-channel")
def sales_channel(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return AnalyticsService.sales_channel_summary(
        db=db,
        company_id=admin.company_id,
    )


# ----------------------------------------
# Inventory Status
# ----------------------------------------
@router.get("/inventory-status")
def inventory_status(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return AnalyticsService.inventory_status(
        db=db,
        company_id=admin.company_id,
    )


# ----------------------------------------
# Low Stock Products
# ----------------------------------------
@router.get("/low-stock-products")
def low_stock_products(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return AnalyticsService.low_stock_products(
        db=db,
        company_id=admin.company_id,
    )


# ----------------------------------------
# Out Of Stock Products
# ----------------------------------------
@router.get("/out-of-stock-products")
def out_of_stock_products(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return AnalyticsService.out_of_stock_products(
        db=db,
        company_id=admin.company_id,
    )


# ----------------------------------------
# Inventory Value By Category
# ----------------------------------------
@router.get("/inventory-value")
def inventory_value(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return AnalyticsService.inventory_value_by_category(
        db=db,
        company_id=admin.company_id,
    )


# ----------------------------------------
# Export Dashboard CSV
# ----------------------------------------
@router.get("/export/csv")
def export_dashboard_csv(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):

    summary = AnalyticsService.get_dashboard_summary(
        db=db,
        company_id=admin.company_id,
    )

    csv_data = export_csv([summary])

    log_event(
        db=db,
        company_id=admin.company_id,
        target_name="Analytics Dashboard",
        action="Export CSV",
        performed_by=f"{admin.name} ({admin.email})",
    )

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=dashboard.csv"
        },
    )


# ----------------------------------------
# Export Dashboard PDF
# ----------------------------------------
@router.get("/export/pdf")
def export_dashboard_pdf(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):

    summary = AnalyticsService.get_dashboard_summary(
        db=db,
        company_id=admin.company_id,
    )

    pdf = export_pdf(summary)

    log_event(
        db=db,
        company_id=admin.company_id,
        target_name="Analytics Dashboard",
        action="Export PDF",
        performed_by=f"{admin.name} ({admin.email})",
    )

    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=dashboard.pdf"
        },
    )