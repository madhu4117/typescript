from typing import Optional

from pydantic import BaseModel, ConfigDict


# =========================================================
# DASHBOARD SUMMARY
# =========================================================

class DashboardSummary(BaseModel):
    totalRevenue: float = 0
    totalOrders: int = 0
    averageOrderValue: float = 0
    totalItemsSold: int = 0
    totalDiscount: float = 0
    totalTax: float = 0

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# REVENUE TREND
# =========================================================

class RevenueTrendItem(BaseModel):
    period: str
    revenue: float = 0
    orders: int = 0

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# TOP PRODUCT
# =========================================================

class TopProductItem(BaseModel):
    productId: int
    productName: str
    quantitySold: int = 0
    revenue: float = 0

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# CUSTOMER ANALYTICS
# =========================================================

class CustomerAnalyticsItem(BaseModel):
    customerId: int
    customerName: str
    orders: int = 0
    totalSpend: float = 0
    averageOrderValue: float = 0

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# PAYMENT METHOD ANALYTICS
# =========================================================

class PaymentMethodItem(BaseModel):
    paymentMethod: str
    transactions: int = 0
    revenue: float = 0

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# SALES VS ORDERS
# =========================================================

class SalesVsOrdersItem(BaseModel):
    period: str
    revenue: float = 0
    orders: int = 0

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# CATEGORY ANALYTICS
# =========================================================

class CategorySalesItem(BaseModel):
    categoryId: int
    categoryName: str
    quantitySold: int = 0
    revenue: float = 0

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# ANALYTICS FILTERS
# =========================================================

class AnalyticsFilters(BaseModel):
    dateRange: Optional[str] = None

    startDate: Optional[str] = None
    endDate: Optional[str] = None

    productId: Optional[int] = None
    categoryId: Optional[int] = None
    customerId: Optional[int] = None
    paymentMethod: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)