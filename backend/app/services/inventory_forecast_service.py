from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem


class InventoryForecastService:

    # =========================================================
    # CONFIGURATION
    # =========================================================

    HISTORY_DAYS = 30

    # Expected supplier lead time.
    # Change this later if your business has different lead times.
    DEFAULT_LEAD_TIME_DAYS = 7

    # Safety stock = average daily sales × safety stock days
    SAFETY_STOCK_DAYS = 3

    # Forecast future demand for 30 days
    FORECAST_DAYS = 30

    # =========================================================
    # AVERAGE DAILY SALES
    # =========================================================

    @staticmethod
    def calculate_average_daily_sales(
        db: Session,
        company_id: int,
        product_id: int,
        history_days: int = HISTORY_DAYS,
    ) -> float:

        now = datetime.now(timezone.utc)
        start_date = now - timedelta(days=history_days)

        quantity_sold = (
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
                Sale.companyId == company_id,
                SaleItem.productId == product_id,
                Sale.saleDate >= start_date,
                Sale.saleDate <= now,
            )
            .scalar()
        )

        quantity_sold = float(quantity_sold or 0)

        return round(
            quantity_sold / history_days,
            2,
        )

    # =========================================================
    # GET SINGLE FORECAST
    # =========================================================

    @staticmethod
    def calculate_product_forecast(
        db: Session,
        company_id: int,
        product: Product,
    ):

        average_daily_sales = (
            InventoryForecastService.calculate_average_daily_sales(
                db=db,
                company_id=company_id,
                product_id=product.id,
            )
        )

        current_stock = int(
            product.stockQuantity or 0
        )

        # -----------------------------------------------------
        # FORECAST DEMAND
        # -----------------------------------------------------

        forecasted_demand = round(
            average_daily_sales
            * InventoryForecastService.FORECAST_DAYS,
            2,
        )

        # -----------------------------------------------------
        # DAYS OF STOCK REMAINING
        # -----------------------------------------------------

        if average_daily_sales > 0:
            days_remaining = round(
                current_stock / average_daily_sales,
                2,
            )
        else:
            days_remaining = None

        # -----------------------------------------------------
        # SAFETY STOCK
        # -----------------------------------------------------

        safety_stock = round(
            average_daily_sales
            * InventoryForecastService.SAFETY_STOCK_DAYS,
            2,
        )

        # -----------------------------------------------------
        # REORDER POINT
        #
        # Reorder Point =
        # Average Daily Demand × Lead Time
        # + Safety Stock
        # -----------------------------------------------------

        reorder_point = round(
            (
                average_daily_sales
                * InventoryForecastService.DEFAULT_LEAD_TIME_DAYS
            )
            + safety_stock,
            2,
        )

        # -----------------------------------------------------
        # RECOMMENDED REORDER QUANTITY
        #
        # Target stock =
        # Forecast demand + Safety stock
        # -----------------------------------------------------

        target_stock = (
            forecasted_demand
            + safety_stock
        )

        recommended_quantity = max(
            0,
            int(
                round(
                    target_stock - current_stock
                )
            ),
        )

        # =====================================================
        # RISK CLASSIFICATION
        # =====================================================

        if current_stock <= 0:

            stock_risk = "Out of Stock"

            recommendation = (
                "Immediate reorder required"
            )

        elif (
            average_daily_sales > 0
            and days_remaining <= 3
        ):

            stock_risk = "Stockout Risk"

            recommendation = (
                "Reorder immediately"
            )

        elif current_stock <= reorder_point:

            stock_risk = "Low Stock"

            recommendation = (
                "Reorder recommended"
            )

        elif (
            average_daily_sales > 0
            and current_stock
            > forecasted_demand
            + safety_stock
        ):

            stock_risk = "Overstock"

            recommendation = (
                "Reduce purchasing and monitor stock"
            )

        else:

            stock_risk = "Healthy"

            recommendation = (
                "Stock level is healthy"
            )

        # =====================================================
        # CATEGORY
        # =====================================================

        category_id = None
        category_name = None

        if product.category:

            category_id = product.category.id
            category_name = product.category.name

        # =====================================================
        # RESULT
        # =====================================================

        return {
            "productId": product.id,
            "productName": product.name,
            "sku": product.sku,

            "categoryId": category_id,
            "categoryName": category_name,

            "currentStock": current_stock,

            "averageDailySales": average_daily_sales,
            "forecastedDemand": forecasted_demand,
            "daysOfStockRemaining": days_remaining,

            "leadTimeDays": (
                InventoryForecastService.DEFAULT_LEAD_TIME_DAYS
            ),

            "safetyStock": safety_stock,
            "reorderPoint": reorder_point,

            "recommendedReorderQuantity": (
                recommended_quantity
            ),

            "stockRisk": stock_risk,
            "recommendation": recommendation,
        }

    # =========================================================
    # GET ALL FORECASTS
    # =========================================================

    @staticmethod
    def get_forecast(
        db: Session,
        company_id: int,
        risk: Optional[str] = None,
        category_id: Optional[int] = None,
        product_id: Optional[int] = None,
        reorder_required: Optional[bool] = None,
        sort_by: str = "risk",
        sort_order: str = "desc",
    ):

        query = (
            db.query(Product)
            .filter(
                Product.companyId == company_id
            )
        )

        # -----------------------------------------------------
        # PRODUCT FILTER
        # -----------------------------------------------------

        if product_id is not None:

            query = query.filter(
                Product.id == product_id
            )

        # -----------------------------------------------------
        # CATEGORY FILTER
        # -----------------------------------------------------

        if category_id is not None:

            query = query.filter(
                Product.categoryId == category_id
            )

        products = query.all()

        results = []

        for product in products:

            forecast = (
                InventoryForecastService
                .calculate_product_forecast(
                    db=db,
                    company_id=company_id,
                    product=product,
                )
            )

            # -------------------------------------------------
            # RISK FILTER
            # -------------------------------------------------

            if risk:

                if (
                    forecast["stockRisk"].lower()
                    != risk.lower()
                ):
                    continue

            # -------------------------------------------------
            # REORDER FILTER
            # -------------------------------------------------

            if reorder_required is not None:

                needs_reorder = (
                    forecast[
                        "recommendedReorderQuantity"
                    ] > 0
                )

                if needs_reorder != reorder_required:
                    continue

            results.append(
                forecast
            )

        # =====================================================
        # SORTING
        # =====================================================

        reverse = sort_order.lower() == "desc"

        if sort_by == "currentStock":

            results.sort(
                key=lambda x: x["currentStock"],
                reverse=reverse,
            )

        elif sort_by == "forecastedDemand":

            results.sort(
                key=lambda x: x["forecastedDemand"],
                reverse=reverse,
            )

        elif sort_by == "daysRemaining":

            results.sort(
                key=lambda x:
                    x["daysOfStockRemaining"]
                    if x["daysOfStockRemaining"] is not None
                    else 999999,
                reverse=reverse,
            )

        elif sort_by == "recommendedQuantity":

            results.sort(
                key=lambda x:
                    x["recommendedReorderQuantity"],
                reverse=reverse,
            )

        else:

            # Risk priority
            risk_priority = {
                "Out of Stock": 5,
                "Stockout Risk": 4,
                "Low Stock": 3,
                "Overstock": 2,
                "Healthy": 1,
            }

            results.sort(
                key=lambda x:
                    risk_priority.get(
                        x["stockRisk"],
                        0,
                    ),
                reverse=reverse,
            )

        # =====================================================
        # SUMMARY
        # =====================================================

        summary = {
            "totalProducts": len(results),

            "productsRequiringReorder": sum(
                1
                for item in results
                if item[
                    "recommendedReorderQuantity"
                ] > 0
            ),

            "productsAtStockoutRisk": sum(
                1
                for item in results
                if item["stockRisk"]
                in [
                    "Out of Stock",
                    "Stockout Risk",
                ]
            ),

            "overstockedProducts": sum(
                1
                for item in results
                if item["stockRisk"]
                == "Overstock"
            ),

            "healthyProducts": sum(
                1
                for item in results
                if item["stockRisk"]
                == "Healthy"
            ),
        }

        return {
            "summary": summary,
            "items": results,
        }

    # =========================================================
    # SINGLE PRODUCT
    # =========================================================

    @staticmethod
    def get_product_recommendation(
        db: Session,
        company_id: int,
        product_id: int,
    ):

        product = (
            db.query(Product)
            .filter(
                Product.id == product_id,
                Product.companyId == company_id,
            )
            .first()
        )

        if not product:
            return None

        return (
            InventoryForecastService
            .calculate_product_forecast(
                db=db,
                company_id=company_id,
                product=product,
            )
        )

    # =========================================================
    # STOCK PROJECTION
    # =========================================================

    @staticmethod
    def get_stock_projection(
        db: Session,
        company_id: int,
        product_id: int,
    ):

        product = (
            db.query(Product)
            .filter(
                Product.id == product_id,
                Product.companyId == company_id,
            )
            .first()
        )

        if not product:
            return None

        average_daily_sales = (
            InventoryForecastService
            .calculate_average_daily_sales(
                db=db,
                company_id=company_id,
                product_id=product_id,
            )
        )

        current_stock = float(
            product.stockQuantity or 0
        )

        projection = []

        for day in range(
            1,
            InventoryForecastService.FORECAST_DAYS + 1,
        ):

            projected_stock = max(
                0,
                current_stock
                - (
                    average_daily_sales
                    * day
                ),
            )

            projection.append(
                {
                    "date": (
                        datetime.now(
                            timezone.utc
                        )
                        + timedelta(days=day)
                    ).strftime("%Y-%m-%d"),

                    "projectedStock": round(
                        projected_stock,
                        2,
                    ),

                    "demand": round(
                        average_daily_sales,
                        2,
                    ),
                }
            )

        return projection