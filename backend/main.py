
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database.database import Base, engine


# =========================================================
# MODELS
# Import all models before Base.metadata.create_all()
# =========================================================

from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.audit_log import AuditLog
from app.models.inventory import Inventory
from app.models.inventory_movement import InventoryMovement
from app.models.stock_movement import StockMovement
from app.models.customer import Customer
from app.models.notification import Notification
from app.models.customer_purchase_summary import CustomerPurchaseSummary
from app.models.demand_forecast import DemandForecast
from app.models.forecast_history import ForecastHistory

# Task 12: Data import
from app.models.import_history import ImportHistory
from app.models.import_error import ImportError

# Task 15: Reporting
from app.models.report_history import ReportHistory
from app.models.scheduled_report import ScheduledReport


# =========================================================
# ROUTERS
# =========================================================

from app.routers.analytics import router as analytics_router
from app.routers.auth import router as auth_router
from app.routers.category import router as category_router
from app.routers.product import router as product_router
from app.routers.dashboard import router as dashboard_router
from app.routers.audit import router as audit_router
from app.routers.sale import router as sale_router
from app.routers.inventory import router as inventory_router
from app.routers.customer import router as customer_router
from app.routers.customer_purchase import (
    router as customer_purchase_router,
)
from app.routers.customer_analytics import (
    router as customer_analytics_router,
)
from app.routers.sales_analytics import (
    router as sales_analytics_router,
)
from app.routers.demand_forecasting import (
    router as demand_forecasting_router,
)
from app.routers.inventory_forecast import (
    router as inventory_forecast_router,
)
from app.routers.data_import import router as data_import_router
from app.routers.notifications import (
    router as notifications_router,
)

# Task 15: Reporting and scheduled reports
from app.routers.reports import router as reports_router
from app.routers.scheduled_reports import (
    router as scheduled_report_router,
)


# =========================================================
# CREATE APPLICATION
# =========================================================

app = FastAPI(
    title="RetailPulse Analytics API",
    description=(
        "RetailPulse Analytics backend API for sales, inventory, "
        "analytics, forecasting, smart replenishment, data import, "
        "notifications, reporting, and scheduled reports."
    ),
    version="1.0.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# DATABASE TABLE CREATION
# All model imports must occur before this line.
# =========================================================

Base.metadata.create_all(bind=engine)


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "message": "RetailPulse Analytics API is running",
        "status": "success",
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "RetailPulse Analytics",
    }


# =========================================================
# TASK 1: AUTHENTICATION
# =========================================================

app.include_router(auth_router)


# =========================================================
# CATEGORY
# =========================================================

app.include_router(category_router)


# =========================================================
# PRODUCT
# =========================================================

app.include_router(product_router)


# =========================================================
# DASHBOARD
# =========================================================

app.include_router(dashboard_router)


# =========================================================
# AUDIT LOGS
# =========================================================

app.include_router(audit_router)


# =========================================================
# SALES
# =========================================================

app.include_router(sale_router)


# =========================================================
# INVENTORY
# =========================================================

app.include_router(inventory_router)


# =========================================================
# CUSTOMER
# =========================================================

app.include_router(customer_router)


# =========================================================
# CUSTOMER PURCHASE
# =========================================================

app.include_router(customer_purchase_router)


# =========================================================
# CUSTOMER ANALYTICS
# =========================================================

app.include_router(customer_analytics_router)


# =========================================================
# SALES ANALYTICS
# =========================================================

app.include_router(sales_analytics_router)


# =========================================================
# GENERAL ANALYTICS
# =========================================================

app.include_router(analytics_router)


# =========================================================
# DEMAND FORECASTING
# =========================================================

app.include_router(demand_forecasting_router)


# =========================================================
# TASK 11: INVENTORY FORECASTING
# =========================================================

app.include_router(inventory_forecast_router)


# =========================================================
# TASK 12: DATA IMPORT
# =========================================================

app.include_router(data_import_router)


# =========================================================
# TASK 14: NOTIFICATIONS
# =========================================================

# Main notification routes
app.include_router(notifications_router)

# Keep this alias only if existing clients use /api/notifications.
app.include_router(
    notifications_router,
    prefix="/api",
)


# =========================================================
# TASK 15: REPORTS
# =========================================================

app.include_router(reports_router)


# =========================================================
# TASK 15: SCHEDULED REPORTS
# =========================================================

app.include_router(scheduled_report_router)


# =========================================================
# NOTIFICATION DATABASE COMPATIBILITY CHECK
# =========================================================

try:
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                ALTER TABLE notifications
                ADD COLUMN IF NOT EXISTS details JSONB
                """
            )
        )
except Exception as exc:
    # Do not silently hide migration failures.
    print(
        "Notification schema compatibility check failed:",
        str(exc),
    )