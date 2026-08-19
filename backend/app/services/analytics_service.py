from datetime import datetime, date, timedelta
from typing import Optional

from sqlalchemy import (
    func,
    cast,
    Date,
)
from sqlalchemy.orm import Session

from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product
from app.models.customer import Customer


class AnalyticsService:

    # =========================================================
    # COMMON DATE FILTER
    # =========================================================

    @staticmethod
    def _apply_date_filter(
        query,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ):
        if start_date:
            start_datetime = datetime.combine(
                start_date,
                datetime.min.time(),
            )

            query = query.filter(
                Sale.saleDate >= start_datetime
            )

        if end_date:
            end_datetime = datetime.combine(
                end_date + timedelta(days=1),
                datetime.min.time(),
            )

            query = query.filter(
                Sale.saleDate < end_datetime
            )

        return query

    # =========================================================
    # DASHBOARD SUMMARY
    # =========================================================

    @staticmethod
    def get_dashboard_summary(
        db: Session,
        company_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        product_id: Optional[int] = None,
        category_id: Optional[int] = None,
        customer_id: Optional[int] = None,
        payment_method: Optional[str] = None,
    ):

        query = (
            db.query(
                func.coalesce(
                    func.sum(Sale.totalAmount),
                    0,
                ).label("total_revenue"),

                func.count(
                    Sale.id
                ).label("total_orders"),

                func.coalesce(
                    func.sum(Sale.discount),
                    0,
                ).label("total_discount"),

                func.coalesce(
                    func.sum(Sale.tax),
                    0,
                ).label("total_tax"),
            )
            .filter(
                Sale.companyId == company_id
            )
        )

        query = AnalyticsService._apply_date_filter(
            query,
            start_date,
            end_date,
        )

        if customer_id:
            query = query.filter(
                Sale.customerId == customer_id
            )

        if payment_method:
            query = query.filter(
                Sale.paymentMethod == payment_method
            )

        # Product/category filters require joining SaleItem
        if product_id or category_id:

            query = query.join(
                SaleItem,
                SaleItem.saleId == Sale.id,
            )

            if product_id:
                query = query.filter(
                    SaleItem.productId == product_id
                )

            if category_id:
                query = query.filter(
                    SaleItem.categoryId == category_id
                )

            query = query.distinct()

        result = query.first()

        total_revenue = float(
            result.total_revenue or 0
        )

        total_orders = int(
            result.total_orders or 0
        )

        total_discount = float(
            result.total_discount or 0
        )

        total_tax = float(
            result.total_tax or 0
        )

        # =====================================================
        # TOTAL ITEMS SOLD
        # =====================================================

        item_query = (
            db.query(
                func.coalesce(
                    func.sum(SaleItem.quantity),
                    0,
                )
            )
            .join(
                Sale,
                Sale.id == SaleItem.saleId,
            )
            .filter(
                Sale.companyId == company_id
            )
        )

        item_query = AnalyticsService._apply_date_filter(
            item_query,
            start_date,
            end_date,
        )

        if customer_id:
            item_query = item_query.filter(
                Sale.customerId == customer_id
            )

        if payment_method:
            item_query = item_query.filter(
                Sale.paymentMethod == payment_method
            )

        if product_id:
            item_query = item_query.filter(
                SaleItem.productId == product_id
            )

        if category_id:
            item_query = item_query.filter(
                SaleItem.categoryId == category_id
            )

        total_items_sold = int(
            item_query.scalar() or 0
        )

        average_order_value = (
            total_revenue / total_orders
            if total_orders > 0
            else 0
        )

        return {
            "totalRevenue": round(
                total_revenue,
                2,
            ),
            "totalOrders": total_orders,
            "averageOrderValue": round(
                average_order_value,
                2,
            ),
            "totalItemsSold": total_items_sold,
            "totalDiscount": round(
                total_discount,
                2,
            ),
            "totalTax": round(
                total_tax,
                2,
            ),
        }

    # =========================================================
    # REVENUE TREND
    # =========================================================

    @staticmethod
    def revenue_trend(
        db: Session,
        company_id: int,
        period: str = "daily",
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ):

        if period not in {
            "daily",
            "weekly",
            "monthly",
        }:
            period = "daily"

        if period == "monthly":

            date_group = func.date_trunc(
                "month",
                Sale.saleDate,
            )

        elif period == "weekly":

            date_group = func.date_trunc(
                "week",
                Sale.saleDate,
            )

        else:

            date_group = func.date(
                Sale.saleDate
            )

        query = (
            db.query(
                date_group.label("date"),

                func.coalesce(
                    func.sum(
                        Sale.totalAmount
                    ),
                    0,
                ).label("revenue"),

                func.count(
                    Sale.id
                ).label("orders"),
            )
            .filter(
                Sale.companyId == company_id
            )
        )

        query = AnalyticsService._apply_date_filter(
            query,
            start_date,
            end_date,
        )

        query = (
            query
            .group_by(date_group)
            .order_by(date_group)
        )

        rows = query.all()

        return [
            {
                "date": (
                    row.date.isoformat()
                    if hasattr(
                        row.date,
                        "isoformat",
                    )
                    else str(row.date)
                ),
                "revenue": round(
                    float(
                        row.revenue or 0
                    ),
                    2,
                ),
                "orders": int(
                    row.orders or 0
                ),
            }
            for row in rows
        ]

    # =========================================================
    # TOP PRODUCTS
    # =========================================================

    @staticmethod
    def top_products(
        db: Session,
        company_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        sort_by: str = "revenue",
        limit: int = 10,
    ):

        if sort_by not in {
            "revenue",
            "quantity",
        }:
            sort_by = "revenue"

        limit = min(
            max(limit, 1),
            100,
        )

        query = (
            db.query(
                Product.id.label(
                    "product_id"
                ),

                Product.name.label(
                    "product_name"
                ),

                func.coalesce(
                    func.sum(
                        SaleItem.quantity
                    ),
                    0,
                ).label(
                    "quantity_sold"
                ),

                func.coalesce(
                    func.sum(
                        SaleItem.total
                    ),
                    0,
                ).label(
                    "revenue"
                ),
            )
            .join(
                SaleItem,
                SaleItem.productId
                == Product.id,
            )
            .join(
                Sale,
                Sale.id
                == SaleItem.saleId,
            )
            .filter(
                Sale.companyId == company_id
            )
        )

        query = AnalyticsService._apply_date_filter(
            query,
            start_date,
            end_date,
        )

        query = query.group_by(
            Product.id,
            Product.name,
        )

        if sort_by == "quantity":

            query = query.order_by(
                func.sum(
                    SaleItem.quantity
                ).desc()
            )

        else:

            query = query.order_by(
                func.sum(
                    SaleItem.total
                ).desc()
            )

        query = query.limit(limit)

        rows = query.all()

        return [
            {
                "productId": row.product_id,
                "productName": row.product_name,
                "quantitySold": int(
                    row.quantity_sold or 0
                ),
                "revenue": round(
                    float(
                        row.revenue or 0
                    ),
                    2,
                ),
            }
            for row in rows
        ]

    # =========================================================
    # CATEGORY SALES
    # =========================================================

    @staticmethod
    def category_sales(
        db: Session,
        company_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ):

        from app.models.category import Category

        query = (
            db.query(
                Category.id.label(
                    "category_id"
                ),

                Category.name.label(
                    "category_name"
                ),

                func.coalesce(
                    func.sum(
                        SaleItem.quantity
                    ),
                    0,
                ).label(
                    "quantity_sold"
                ),

                func.coalesce(
                    func.sum(
                        SaleItem.total
                    ),
                    0,
                ).label(
                    "revenue"
                ),
            )
            .join(
                SaleItem,
                SaleItem.categoryId
                == Category.id,
            )
            .join(
                Sale,
                Sale.id
                == SaleItem.saleId,
            )
            .filter(
                Sale.companyId == company_id
            )
        )

        query = AnalyticsService._apply_date_filter(
            query,
            start_date,
            end_date,
        )

        query = (
            query
            .group_by(
                Category.id,
                Category.name,
            )
            .order_by(
                func.sum(
                    SaleItem.total
                ).desc()
            )
        )

        rows = query.all()

        return [
            {
                "categoryId": row.category_id,
                "categoryName": row.category_name,
                "quantitySold": int(
                    row.quantity_sold or 0
                ),
                "revenue": round(
                    float(
                        row.revenue or 0
                    ),
                    2,
                ),
            }
            for row in rows
        ]

    # =========================================================
    # CUSTOMER REVENUE
    # =========================================================

    @staticmethod
    def customer_revenue(
        db: Session,
        company_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 10,
    ):

        limit = min(
            max(limit, 1),
            100,
        )

        query = (
            db.query(
                Customer.id.label(
                    "customer_id"
                ),

                func.concat(
                    Customer.firstName,
                    " ",
                    Customer.lastName,
                ).label(
                    "customer_name"
                ),

                func.count(
                    Sale.id.distinct()
                ).label(
                    "orders"
                ),

                func.coalesce(
                    func.sum(
                        Sale.totalAmount
                    ),
                    0,
                ).label(
                    "total_spend"
                ),
            )
            .join(
                Sale,
                Sale.customerId
                == Customer.id,
            )
            .filter(
                Sale.companyId == company_id
            )
        )

        query = AnalyticsService._apply_date_filter(
            query,
            start_date,
            end_date,
        )

        query = (
            query
            .group_by(
                Customer.id,
                Customer.firstName,
                Customer.lastName,
            )
            .order_by(
                func.sum(
                    Sale.totalAmount
                ).desc()
            )
            .limit(limit)
        )

        rows = query.all()

        return [
            {
                "customerId": row.customer_id,
                "customerName": row.customer_name,
                "orders": int(
                    row.orders or 0
                ),
                "totalSpend": round(
                    float(
                        row.total_spend or 0
                    ),
                    2,
                ),
                "averageOrderValue": round(
                    (
                        float(
                            row.total_spend or 0
                        )
                        / int(
                            row.orders or 1
                        )
                    ),
                    2,
                ),
            }
            for row in rows
        ]

    # =========================================================
    # PAYMENT METHOD
    # =========================================================

    @staticmethod
    def payment_method_summary(
        db: Session,
        company_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ):

        query = (
            db.query(
                Sale.paymentMethod.label(
                    "payment_method"
                ),

                func.count(
                    Sale.id
                ).label(
                    "transactions"
                ),

                func.coalesce(
                    func.sum(
                        Sale.totalAmount
                    ),
                    0,
                ).label(
                    "revenue"
                ),
            )
            .filter(
                Sale.companyId == company_id
            )
        )

        query = AnalyticsService._apply_date_filter(
            query,
            start_date,
            end_date,
        )

        query = (
            query
            .group_by(
                Sale.paymentMethod
            )
            .order_by(
                func.sum(
                    Sale.totalAmount
                ).desc()
            )
        )

        rows = query.all()

        return [
            {
                "paymentMethod": (
                    row.payment_method
                ),
                "transactions": int(
                    row.transactions or 0
                ),
                "revenue": round(
                    float(
                        row.revenue or 0
                    ),
                    2,
                ),
            }
            for row in rows
        ]

    # =========================================================
    # SALES CHANNEL
    # =========================================================

    @staticmethod
    def sales_channel_summary(
        db: Session,
        company_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ):

        query = (
            db.query(
                Sale.salesChannel.label(
                    "sales_channel"
                ),

                func.count(
                    Sale.id
                ).label(
                    "transactions"
                ),

                func.coalesce(
                    func.sum(
                        Sale.totalAmount
                    ),
                    0,
                ).label(
                    "revenue"
                ),
            )
            .filter(
                Sale.companyId == company_id
            )
        )

        query = AnalyticsService._apply_date_filter(
            query,
            start_date,
            end_date,
        )

        query = (
            query
            .group_by(
                Sale.salesChannel
            )
            .order_by(
                func.sum(
                    Sale.totalAmount
                ).desc()
            )
        )

        rows = query.all()

        return [
            {
                "salesChannel": (
                    row.sales_channel
                ),
                "transactions": int(
                    row.transactions or 0
                ),
                "revenue": round(
                    float(
                        row.revenue or 0
                    ),
                    2,
                ),
            }
            for row in rows
        ]

    # =========================================================
    # INVENTORY STATUS
    # =========================================================

    @staticmethod
    def inventory_status(
        db: Session,
        company_id: int,
    ):

        from app.models.product import ProductStatus

        rows = (
            db.query(
                Product.status,
                func.count(
                    Product.id
                ).label("count"),
            )
            .filter(
                Product.companyId
                == company_id
            )
            .group_by(
                Product.status
            )
            .all()
        )

        return [
            {
                "status": (
                    row.status.value
                    if hasattr(
                        row.status,
                        "value",
                    )
                    else str(row.status)
                ),
                "count": int(
                    row.count or 0
                ),
            }
            for row in rows
        ]

    # =========================================================
    # LOW STOCK PRODUCTS
    # =========================================================

    @staticmethod
    def low_stock_products(
        db: Session,
        company_id: int,
        threshold: int = 10,
    ):

        rows = (
            db.query(Product)
            .filter(
                Product.companyId
                == company_id,
                Product.stockQuantity
                > 0,
                Product.stockQuantity
                <= threshold,
            )
            .order_by(
                Product.stockQuantity.asc()
            )
            .limit(100)
            .all()
        )

        return [
            {
                "productId": product.id,
                "productName": product.name,
                "stockQuantity": product.stockQuantity,
                "unitPrice": product.unitPrice,
            }
            for product in rows
        ]

    # =========================================================
    # OUT OF STOCK PRODUCTS
    # =========================================================

    @staticmethod
    def out_of_stock_products(
        db: Session,
        company_id: int,
    ):

        rows = (
            db.query(Product)
            .filter(
                Product.companyId
                == company_id,
                Product.stockQuantity <= 0,
            )
            .order_by(
                Product.name.asc()
            )
            .limit(100)
            .all()
        )

        return [
            {
                "productId": product.id,
                "productName": product.name,
                "stockQuantity": product.stockQuantity,
                "unitPrice": product.unitPrice,
            }
            for product in rows
        ]

    # =========================================================
    # INVENTORY VALUE BY CATEGORY
    # =========================================================

    @staticmethod
    def inventory_value_by_category(
        db: Session,
        company_id: int,
    ):

        from app.models.category import Category

        rows = (
            db.query(
                Category.id.label(
                    "category_id"
                ),

                Category.name.label(
                    "category_name"
                ),

                func.coalesce(
                    func.sum(
                        Product.stockQuantity
                        * Product.costPrice
                    ),
                    0,
                ).label(
                    "inventory_value"
                ),
            )
            .join(
                Product,
                Product.categoryId
                == Category.id,
            )
            .filter(
                Product.companyId
                == company_id
            )
            .group_by(
                Category.id,
                Category.name,
            )
            .order_by(
                func.sum(
                    Product.stockQuantity
                    * Product.costPrice
                ).desc()
            )
            .all()
        )

        return [
            {
                "categoryId": row.category_id,
                "categoryName": row.category_name,
                "inventoryValue": round(
                    float(
                        row.inventory_value
                        or 0
                    ),
                    2,
                ),
            }
            for row in rows
        ]

    # =========================================================
    # COMPATIBILITY ALIASES
    # =========================================================

    @staticmethod
    def get_sales_analytics_dashboard(
        db: Session,
        company_id: int,
    ):
        return AnalyticsService.get_dashboard_summary(
            db=db,
            company_id=company_id,
        )

    @staticmethod
    def get_sales_analytics_growth(
        db: Session,
        company_id: int,
    ):
        return AnalyticsService.revenue_trend(
            db=db,
            company_id=company_id,
        )

    @staticmethod
    def get_sales_analytics_by_channel(
        db: Session,
        company_id: int,
    ):
        return AnalyticsService.sales_channel_summary(
            db=db,
            company_id=company_id,
        )

    @staticmethod
    def get_sales_analytics_by_payment_method(
        db: Session,
        company_id: int,
    ):
        return AnalyticsService.payment_method_summary(
            db=db,
            company_id=company_id,
        )