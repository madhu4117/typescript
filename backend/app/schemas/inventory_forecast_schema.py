from typing import Optional, List

from pydantic import BaseModel, ConfigDict


# =========================================================
# FORECAST ITEM
# =========================================================

class InventoryForecastItem(BaseModel):
    productId: int
    productName: str
    sku: str
    categoryId: Optional[int] = None
    categoryName: Optional[str] = None

    currentStock: int

    averageDailySales: float
    forecastedDemand: float
    daysOfStockRemaining: Optional[float] = None

    leadTimeDays: int
    safetyStock: float
    reorderPoint: float
    recommendedReorderQuantity: int

    stockRisk: str
    recommendation: str

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# SUMMARY
# =========================================================

class InventoryForecastSummary(BaseModel):
    totalProducts: int
    productsRequiringReorder: int
    productsAtStockoutRisk: int
    overstockedProducts: int
    healthyProducts: int


# =========================================================
# RESPONSE
# =========================================================

class InventoryForecastResponse(BaseModel):
    summary: InventoryForecastSummary
    items: List[InventoryForecastItem]


# =========================================================
# PRODUCT RECOMMENDATION
# =========================================================

class InventoryRecommendationResponse(BaseModel):
    product: InventoryForecastItem


# =========================================================
# STOCK PROJECTION
# =========================================================

class StockProjectionItem(BaseModel):
    date: str
    projectedStock: float
    demand: float