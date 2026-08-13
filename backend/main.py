from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import Base, engine


# =========================================================
# MODELS
# =========================================================

from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.audit_log import AuditLog
from app.models.inventory import Inventory
from app.models.inventory_movement import InventoryMovement

from app.models.customer import Customer
from app.models.customer_purchase_summary import (
    CustomerPurchaseSummary
)

from app.models.demand_forecast import DemandForecast
from app.models.forecast_history import ForecastHistory


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
    router as customer_purchase_router
)

from app.routers.customer_analytics import (
    router as customer_analytics_router
)

from app.routers.sales_analytics import (
    router as sales_analytics_router
)

from app.routers.demand_forecasting import (
    router as demand_forecasting_router
)


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="RetailPulse API",
    description="RetailPulse Retail Management Backend API",
    version="1.0.0",
)


# =========================================================
# CREATE DATABASE TABLES
# =========================================================

Base.metadata.create_all(
    bind=engine
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
# REGISTER ROUTERS
# =========================================================

# Authentication
app.include_router(
    auth_router
)


# Categories
app.include_router(
    category_router
)


# Products
app.include_router(
    product_router
)


# Dashboard
app.include_router(
    dashboard_router
)


# Audit
app.include_router(
    audit_router
)


# Sales
app.include_router(
    sale_router
)


# Inventory
app.include_router(
    inventory_router
)


# Analytics
app.include_router(
    analytics_router
)


# Customers
app.include_router(
    customer_router
)


# Customer Purchase
app.include_router(
    customer_purchase_router
)


# Customer Analytics
app.include_router(
    customer_analytics_router
)


# Sales Analytics
app.include_router(
    sales_analytics_router
)


# Demand Forecasting
app.include_router(
    demand_forecasting_router
)


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():
    return {
        "message": "RetailPulse Backend Running"
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "message": "RetailPulse API is running"
    }