from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.category import Category


class AnalyticsService:

    # -----------------------------------------------------
    # Dashboard Summary
    # -----------------------------------------------------
    @staticmethod
    def get_dashboard_summary(
        db: Session,
        company_id: int,
    ):

        total_revenue = (
            db.query(
                func.coalesce(func.sum(Sale.totalAmount), 0)
            )
            .filter(
                Sale.companyId == company_id
            )
            .scalar()
        )

        total_orders = (
            db.query(Sale)
            .filter(
                Sale.companyId == company_id
            )
            .count()
        )

        total_products_sold = (
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
            .scalar()
        )

        average_order_value = (
            total_revenue / total_orders
            if total_orders > 0
            else 0
        )

        total_inventory_value = (
            db.query(
                func.coalesce(
                    func.sum(
                        Product.stockQuantity * Product.unitPrice
                    ),
                    0,
                )
            )
            .filter(
                Product.companyId == company_id
            )
            .scalar()
        )

        low_stock_products = (
            db.query(Product)
            .filter(
                Product.companyId == company_id,
                Product.stockQuantity > 0,
                Product.stockQuantity <= 10,
            )
            .count()
        )

        out_of_stock_products = (
            db.query(Product)
            .filter(
                Product.companyId == company_id,
                Product.stockQuantity == 0,
            )
            .count()
        )

        total_categories = (
            db.query(Category)
            .filter(
                Category.companyId == company_id
            )
            .count()
        )

        return {
            "totalRevenue": total_revenue,
            "totalOrders": total_orders,
            "totalProductsSold": total_products_sold,
            "averageOrderValue": average_order_value,
            "totalInventoryValue": total_inventory_value,
            "lowStockProducts": low_stock_products,
            "outOfStockProducts": out_of_stock_products,
            "totalCategories": total_categories,
        }

    # -----------------------------------------------------
    # Revenue Trend
    # -----------------------------------------------------
    @staticmethod
    def revenue_trend(
        db: Session,
        company_id: int,
    ):

        result = (
            db.query(
                func.date(Sale.saleDate).label("date"),
                func.coalesce(
                    func.sum(Sale.totalAmount),
                    0,
                ).label("revenue"),
            )
            .filter(
                Sale.companyId == company_id
            )
            .group_by(
                func.date(Sale.saleDate)
            )
            .order_by(
                func.date(Sale.saleDate)
            )
            .all()
        )

        return [
            {
                "date": str(row.date),
                "revenue": float(row.revenue),
            }
            for row in result
        ]
           
# -----------------------------------------------------
# Top Products
# -----------------------------------------------------
    @staticmethod
    def top_products(
    db: Session,
    company_id: int,
    ):
        result = (
        db.query(
            Product.name.label("product"),
            func.sum(
                SaleItem.quantity
            ).label("quantity"),
        )
        .join(
            SaleItem,
            Product.id == SaleItem.productId,
        )
        .join(
            Sale,
            Sale.id == SaleItem.saleId,
        )
        .filter(
            Product.companyId == company_id,
            Sale.companyId == company_id,
        )
        .group_by(
            Product.name
        )
        .order_by(
            func.sum(
                SaleItem.quantity
            ).desc()
        )
        .limit(10)
        .all()
        )

        return [
        {
            "product": row.product,
            "quantity": int(row.quantity or 0),
        }
        for row in result
        ]
    # -----------------------------------------------------
    # Category Sales
    # -----------------------------------------------------
    @staticmethod
    def category_sales(
        db: Session,
        company_id: int,
    ):

        result = (
            db.query(
                Category.name.label("category"),
                func.coalesce(
                    func.sum(SaleItem.total),
                    0
                ).label("sales"),
            )
            .join(
                SaleItem,
                Category.id == SaleItem.categoryId,
            )
            .join(
                Sale,
                Sale.id == SaleItem.saleId,
            )
            .filter(
                Category.companyId == company_id,
                Sale.companyId == company_id,
            )
            .group_by(
                Category.name
            )
            .all()
        )

        return [
            {
                "category": row.category,
                "sales": float(row.sales),
            }
            for row in result
        ]

    # -----------------------------------------------------
    # Payment Method Summary
    # -----------------------------------------------------
    @staticmethod
    def payment_method_summary(
        db: Session,
        company_id: int,
    ):

        result = (
            db.query(
                Sale.paymentMethod.label("method"),
                func.count(Sale.id).label("count"),
            )
            .filter(
                Sale.companyId == company_id
            )
            .group_by(
                Sale.paymentMethod
            )
            .all()
        )

        return [
            {
                "method": row.method,
                "count": int(row.count),
            }
            for row in result
        ]

    # -----------------------------------------------------
    # Sales Channel Summary
    # -----------------------------------------------------
    @staticmethod
    def sales_channel_summary(
        db: Session,
        company_id: int,
    ):

        result = (
            db.query(
                Sale.salesChannel.label("channel"),
                func.count(Sale.id).label("count"),
            )
            .filter(
                Sale.companyId == company_id
            )
            .group_by(
                Sale.salesChannel
            )
            .all()
        )

        return [
            {
                "channel": row.channel,
                "count": int(row.count),
            }
            for row in result
        ]
            # -----------------------------------------------------
    # Inventory Status
    # -----------------------------------------------------
    @staticmethod
    def inventory_status(
        db: Session,
        company_id: int,
    ):

        in_stock = (
            db.query(Product)
            .filter(
                Product.companyId == company_id,
                Product.stockQuantity > 10,
            )
            .count()
        )

        low_stock = (
            db.query(Product)
            .filter(
                Product.companyId == company_id,
                Product.stockQuantity > 0,
                Product.stockQuantity <= 10,
            )
            .count()
        )

        out_of_stock = (
            db.query(Product)
            .filter(
                Product.companyId == company_id,
                Product.stockQuantity == 0,
            )
            .count()
        )

        return [
            {
                "status": "In Stock",
                "count": in_stock,
            },
            {
                "status": "Low Stock",
                "count": low_stock,
            },
            {
                "status": "Out of Stock",
                "count": out_of_stock,
            },
        ]

    # -----------------------------------------------------
    # Low Stock Products
    # -----------------------------------------------------
    @staticmethod
    def low_stock_products(
        db: Session,
        company_id: int,
    ):

        result = (
            db.query(Product)
            .filter(
                Product.companyId == company_id,
                Product.stockQuantity > 0,
                Product.stockQuantity <= 10,
            )
            .order_by(Product.stockQuantity.asc())
            .all()
        )

        return [
            {
                "product": product.name,
                "stock": product.stockQuantity,
            }
            for product in result
        ]

    # -----------------------------------------------------
    # Out Of Stock Products
    # -----------------------------------------------------
    @staticmethod
    def out_of_stock_products(
        db: Session,
        company_id: int,
    ):

        result = (
            db.query(Product)
            .filter(
                Product.companyId == company_id,
                Product.stockQuantity == 0,
            )
            .all()
        )

        return [
            {
                "product": product.name,
                "sku": product.sku,
                "price": product.unitPrice,
            }
            for product in result
        ]

    # -----------------------------------------------------
    # Inventory Value By Category
    # -----------------------------------------------------
    @staticmethod
    def inventory_value_by_category(
        db: Session,
        company_id: int,
    ):

        result = (
            db.query(
                Category.name.label("category"),
                func.coalesce(
                    func.sum(
                        Product.stockQuantity * Product.unitPrice
                    ),
                    0,
                ).label("value"),
            )
            .join(
                Product,
                Product.categoryId == Category.id,
            )
            .filter(
                Category.companyId == company_id,
                Product.companyId == company_id,
            )
            .group_by(
                Category.name
            )
            .all()
        )

        return [
            {
                "category": row.category,
                "value": float(row.value),
            }
            for row in result
        ]