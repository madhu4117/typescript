from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ------------------------------------
# Inventory Base
# ------------------------------------

class InventoryBase(BaseModel):
    productId: int
    reorderLevel: int = Field(ge=0)


# ------------------------------------
# Create Inventory
# ------------------------------------

class InventoryCreate(InventoryBase):
    currentStock: int = Field(ge=0)
    reservedStock: int = Field(default=0, ge=0)


# ------------------------------------
# Update Reorder Level
# ------------------------------------

class InventoryUpdate(BaseModel):
    reorderLevel: int = Field(ge=0)


# ------------------------------------
# Stock Adjustment
# ------------------------------------

class StockAdjustmentRequest(BaseModel):
    quantity: int = Field(gt=0)
    reason: str
    remarks: Optional[str] = None


# ------------------------------------
# Inventory Response
# ------------------------------------

class InventoryResponse(BaseModel):
    id: int
    companyId: int
    productId: int

    currentStock: int
    reservedStock: int
    availableStock: int

    reorderLevel: int
    stockStatus: str

    updatedAt: datetime

    class Config:
        from_attributes = True


# ------------------------------------
# Inventory Movement Response
# ------------------------------------

class InventoryMovementResponse(BaseModel):
    id: int

    inventoryId: int

    movementType: str

    quantityChanged: int

    previousQuantity: int

    updatedQuantity: int

    reason: str

    remarks: Optional[str] = None

    performedBy: int

    createdAt: datetime

    class Config:
        from_attributes = True


# ------------------------------------
# Dashboard Summary
# ------------------------------------

class InventoryDashboard(BaseModel):
    totalProducts: int
    totalInventory: int
    lowStockProducts: int
    outOfStockProducts: int