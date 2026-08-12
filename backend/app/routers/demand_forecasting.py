from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.utils.security import get_current_user

from app.models.user import User
from app.models.product import Product, ProductStatus
from app.models.demand_forecast import DemandForecast
from app.models.sale import Sale
from app.models.sale_item import SaleItem

from app.services.forecasting_service import generate_forecasts


router = APIRouter(
    prefix="/demand-forecast",
    tags=["Demand Forecasting"],
)


# ============================================================
# GENERATE FORECAST
# ============================================================

@router.post("/generate")
def generate_forecast(
    period: str = "30",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company_id = current_user.company_id

    try:
        forecasts = generate_forecasts(
            db=db,
            company_id=company_id,
            period=period,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    return {
        "message": "Forecast generated successfully",
        "forecastPeriod": period,
        "count": len(forecasts),
    }


# ============================================================
# PRODUCT FORECAST
# ============================================================

@router.get("/products")
def get_product_forecasts(
    period: str = "30",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company_id = current_user.company_id

    forecasts = (
        db.query(
            DemandForecast,
            Product,
        )
        .join(
            Product,
            Product.id == DemandForecast.productId,
        )
        .filter(
            DemandForecast.companyId == company_id,
            DemandForecast.forecastPeriod == period,
            Product.companyId == company_id,
            Product.status == ProductStatus.ACTIVE,
        )
        .all()
    )

    result = []

    for forecast, product in forecasts:
        result.append(
            {
                "id": forecast.id,
                "productId": product.id,
                "productName": product.name,
                "brand": product.brand,
                "categoryId": product.categoryId,
                "currentStock": product.stockQuantity,
                "predictedDemand": forecast.predictedDemand,
                "forecastPeriod": forecast.forecastPeriod,
                "confidenceLevel": forecast.confidenceScore,
            }
        )

    return result


# ============================================================
# CATEGORY FORECAST
# ============================================================

@router.get("/categories")
def get_category_forecasts(
    period: str = "30",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company_id = current_user.company_id

    forecasts = (
        db.query(DemandForecast)
        .filter(
            DemandForecast.companyId == company_id,
            DemandForecast.forecastPeriod == period,
        )
        .all()
    )

    category_data = {}

    for forecast in forecasts:

        category_id = forecast.categoryId

        if category_id not in category_data:
            category_data[category_id] = {
                "categoryId": category_id,
                "historicalSales": 0,
                "predictedDemand": 0,
            }

        category_data[category_id][
            "predictedDemand"
        ] += float(
            forecast.predictedDemand or 0
        )

    # --------------------------------------------------------
    # Calculate historical sales
    # --------------------------------------------------------

    for category_id, data in category_data.items():

        historical = (
            db.query(SaleItem.quantity)
            .join(
                Sale,
                Sale.id == SaleItem.saleId,
            )
            .filter(
                Sale.companyId == company_id,
                SaleItem.categoryId == category_id,
            )
            .all()
        )

        historical_sales = sum(
            float(row.quantity or 0)
            for row in historical
        )

        data["historicalSales"] = historical_sales

        if historical_sales > 0:

            data["expectedGrowthPercentage"] = round(
                (
                    (
                        data["predictedDemand"]
                        - historical_sales
                    )
                    / historical_sales
                )
                * 100,
                2,
            )

        else:
            data["expectedGrowthPercentage"] = 0

    return list(category_data.values())


# ============================================================
# INVENTORY RECOMMENDATIONS
# ============================================================

@router.get("/recommendations")
def get_inventory_recommendations(
    period: str = "30",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company_id = current_user.company_id

    forecasts = (
        db.query(
            DemandForecast,
            Product,
        )
        .join(
            Product,
            Product.id == DemandForecast.productId,
        )
        .filter(
            DemandForecast.companyId == company_id,
            DemandForecast.forecastPeriod == period,
            Product.companyId == company_id,
            Product.status == ProductStatus.ACTIVE,
        )
        .all()
    )

    result = []

    for forecast, product in forecasts:

        stock = float(
            product.stockQuantity or 0
        )

        predicted = float(
            forecast.predictedDemand or 0
        )

        # ----------------------------------------------------
        # Recommendation logic
        # ----------------------------------------------------

        if stock <= 0:

            recommendation = (
                "Immediate Restock Required"
            )

        elif stock < predicted:

            recommendation = "Reorder Soon"

        elif stock > predicted * 2:

            recommendation = "Overstock Risk"

        else:

            recommendation = "Stock Level Healthy"

        result.append(
            {
                "productId": product.id,
                "productName": product.name,
                "brand": product.brand,
                "categoryId": product.categoryId,
                "currentStock": stock,
                "predictedDemand": predicted,
                "recommendation": recommendation,
            }
        )

    return result


# ============================================================
# FORECAST DASHBOARD KPIs
# ============================================================

@router.get("/dashboard")
def get_forecast_dashboard(
    period: str = "30",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company_id = current_user.company_id

    forecasts = (
        db.query(
            DemandForecast,
            Product,
        )
        .join(
            Product,
            Product.id == DemandForecast.productId,
        )
        .filter(
            DemandForecast.companyId == company_id,
            DemandForecast.forecastPeriod == period,
            Product.companyId == company_id,
            Product.status == ProductStatus.ACTIVE,
        )
        .all()
    )

    total_predicted = 0
    run_out = 0
    high_growth = 0
    slow_moving = 0
    confidence_total = 0

    for forecast, product in forecasts:

        predicted = float(
            forecast.predictedDemand or 0
        )

        stock = float(
            product.stockQuantity or 0
        )

        confidence = float(
            forecast.confidenceScore or 0
        )

        total_predicted += predicted

        confidence_total += confidence

        # ----------------------------------------------------
        # Products expected to run out
        # ----------------------------------------------------

        if stock < predicted:
            run_out += 1

        # ----------------------------------------------------
        # High growth products
        # ----------------------------------------------------

        if predicted > max(stock, 1) * 1.5:
            high_growth += 1

        # ----------------------------------------------------
        # Slow moving products
        # ----------------------------------------------------

        if (
            predicted < 5
            and stock > predicted * 2
        ):
            slow_moving += 1

    count = len(forecasts)

    if count > 0:
        accuracy = confidence_total / count
    else:
        accuracy = 0

    return {
        "totalPredictedDemand": round(
            total_predicted,
            2,
        ),

        "productsExpectedToRunOut": run_out,

        "highGrowthProducts": high_growth,

        "slowMovingProducts": slow_moving,

        "forecastAccuracy": round(
            accuracy,
            2,
        ),

        "forecastPeriod": period,

        "productsForecasted": count,
    }