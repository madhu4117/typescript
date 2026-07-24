from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import Base, engine

from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.audit_log import AuditLog
from app.models.inventory import Inventory
from app.models.inventory_movement import InventoryMovement

from app.routers.auth import router as auth_router
from app.routers.category import router as category_router
from app.routers.product import router as product_router
from app.routers.dashboard import router as dashboard_router
from app.routers.audit import router as audit_router
from app.routers.sale import router as sale_router
from app.routers.inventory import router as inventory_router

app = FastAPI(title="RetailPulse API")

# Create Database Tables
Base.metadata.create_all(bind=engine)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth_router)
app.include_router(category_router)
app.include_router(product_router)
app.include_router(dashboard_router)
app.include_router(audit_router)
app.include_router(sale_router)
app.include_router(inventory_router)


@app.get("/")
def home():
    return {
        "message": "RetailPulse Backend Running"
    }