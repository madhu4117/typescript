from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ----------------------------
# Inventory Base
# ----------------------------
class InventoryBase(BaseModel):
    productId: int
    reorderLevel: int = Field(ge=0)


# ----------------------------
# Create Inventory
# ----------------------------
class InventoryCreate(InventoryBase):
    currentStock: int = Field(ge=0)
    reservedStock: int = 0


# ----------------------------
# Update Inventory
# ----------------------------
class InventoryUpdate(BaseModel):
    reorderLevel: Optional[int] = Field(default=None, ge=0)


# ----------------------------
# Stock Adjustment Request
# ----------------------------
class StockAdjustmentRequest(BaseModel):
    movementType: str
    quantity: int = Field(gt=0)
    reason: str
    remarks: Optional[str] = None


# ----------------------------
# Inventory Response
# ----------------------------
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


# ----------------------------
# Inventory Movement Response
# ----------------------------
class InventoryMovementResponse(BaseModel):
    id: int

    inventoryId: int

    movementType: str

    quantityChanged: int

    previousQuantity: int

    updatedQuantity: int

    reason: str

    remarks: Optional[str]

    performedBy: int

    createdAt: datetime

    class Config:
        from_attributes = True


# ----------------------------
# Dashboard Summary
# ----------------------------
class InventoryDashboard(BaseModel):
    totalProducts: int
    totalInventory: int
    lowStockProducts: int
    outOfStockProducts: int