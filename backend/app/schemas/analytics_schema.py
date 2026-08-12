from pydantic import BaseModel


class DashboardSummary(BaseModel):
    totalRevenue: float
    totalOrders: int
    totalProductsSold: int
    averageOrderValue: float
    totalInventoryValue: float
    lowStockProducts: int
    outOfStockProducts: int
    totalCategories: int