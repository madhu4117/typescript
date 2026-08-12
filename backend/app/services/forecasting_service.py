from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.product import (
    Product,
    ProductStatus,
)

from app.models.sale import Sale
from app.models.sale_item import SaleItem

from app.models.demand_forecast import DemandForecast
from app.models.forecast_history import ForecastHistory


# ============================================================
# FORECAST PERIOD
# ============================================================

def get_forecast_days(period: str):

    periods = {
        "7": 7,
        "30": 30,
        "90": 90,
        "7_days": 7,
        "30_days": 30,
        "90_days": 90,
    }

    if period not in periods:
        raise ValueError(
            "Forecast period must be 7, 30 or 90 days"
        )

    return periods[period]


# ============================================================
# CALCULATE PRODUCT FORECAST
# ============================================================

def calculate_product_forecast(
    db: Session,
    product: Product,
    days: int,
    company_id: int,
):

    # IMPORTANT:
    # Use timezone-aware UTC datetime because Sale.saleDate
    # is defined with DateTime(timezone=True).

    today = datetime.now(timezone.utc)

    historical_start = (
        today - timedelta(days=90)
    )

    # --------------------------------------------------------
    # Get historical sales
    # --------------------------------------------------------

    rows = (
        db.query(
            SaleItem.quantity,
            Sale.saleDate,
        )
        .join(
            Sale,
            Sale.id == SaleItem.saleId,
        )
        .filter(
            Sale.companyId == company_id,

            SaleItem.productId == product.id,

            Sale.saleDate >= historical_start,

            Sale.saleDate <= today,
        )
        .all()
    )

    # No historical sales
    if not rows:
        return None

    total_quantity = sum(
        float(row.quantity or 0)
        for row in rows
    )

    if total_quantity <= 0:
        return None

    # --------------------------------------------------------
    # Historical daily average
    # --------------------------------------------------------

    historical_days = max(
        (today - historical_start).days,
        1,
    )

    daily_average = (
        total_quantity /
        historical_days
    )

    # --------------------------------------------------------
    # Base predicted demand
    # --------------------------------------------------------

    predicted_demand = (
        daily_average * days
    )

    # --------------------------------------------------------
    # Recent 30-day trend
    # --------------------------------------------------------

    recent_start = (
        today - timedelta(days=30)
    )

    recent_rows = [
        row
        for row in rows
        if row.saleDate
        and row.saleDate >= recent_start
    ]

    recent_quantity = sum(
        float(row.quantity or 0)
        for row in recent_rows
    )

    recent_average = (
        recent_quantity / 30
    )

    # --------------------------------------------------------
    # Trend adjustment
    # --------------------------------------------------------

    if daily_average > 0:

        trend_ratio = (
            recent_average /
            daily_average
        )

        # Prevent extreme predictions

        trend_ratio = max(
            0.5,
            min(
                trend_ratio,
                1.5,
            ),
        )

    else:

        trend_ratio = 1

    predicted_demand *= trend_ratio

    # --------------------------------------------------------
    # Confidence score
    # --------------------------------------------------------

    sales_days = len(
        set(
            row.saleDate.date()
            for row in rows
            if row.saleDate
        )
    )

    confidence = min(
        95,
        max(
            50,
            50 + sales_days * 0.5,
        ),
    )

    return {
        "historicalSales": total_quantity,

        "predictedDemand": round(
            predicted_demand,
            2,
        ),

        "confidenceScore": round(
            confidence,
            2,
        ),
    }


# ============================================================
# GENERATE FORECASTS
# ============================================================

def generate_forecasts(
    db: Session,
    company_id: int,
    period: str,
):

    days = get_forecast_days(period)

    # --------------------------------------------------------
    # Only active products belonging to this company
    # --------------------------------------------------------

    products = (
        db.query(Product)
        .filter(

            Product.companyId == company_id,

            Product.status == ProductStatus.ACTIVE,

        )
        .all()
    )

    generated = []

    # --------------------------------------------------------
    # Generate product forecasts
    # --------------------------------------------------------

    for product in products:

        result = calculate_product_forecast(
            db=db,

            product=product,

            days=days,

            company_id=company_id,
        )

        # Skip products with no historical sales

        if result is None:
            continue

        # ----------------------------------------------------
        # Check existing forecast
        # ----------------------------------------------------

        existing = (
            db.query(DemandForecast)
            .filter(

                DemandForecast.companyId
                == company_id,

                DemandForecast.productId
                == product.id,

                DemandForecast.forecastPeriod
                == period,

            )
            .first()
        )

        # ----------------------------------------------------
        # Update existing forecast
        # ----------------------------------------------------

        if existing:

            existing.predictedDemand = (
                result["predictedDemand"]
            )

            existing.confidenceScore = (
                result["confidenceScore"]
            )

            existing.generatedAt = (
                datetime.now(timezone.utc)
            )

            forecast = existing

        # ----------------------------------------------------
        # Create new forecast
        # ----------------------------------------------------

        else:

            forecast = DemandForecast(

                companyId=company_id,

                productId=product.id,

                categoryId=product.categoryId,

                forecastPeriod=period,

                predictedDemand=(
                    result["predictedDemand"]
                ),

                confidenceScore=(
                    result["confidenceScore"]
                ),

                generatedAt=(
                    datetime.now(timezone.utc)
                ),
            )

            db.add(forecast)

            db.flush()

        # ----------------------------------------------------
        # Forecast history
        # ----------------------------------------------------

        history = ForecastHistory(

            forecastId=forecast.id,

            historicalSales=(
                result["historicalSales"]
            ),

            prediction=(
                result["predictedDemand"]
            ),

            accuracy=None,

        )

        db.add(history)

        generated.append(forecast)

    # --------------------------------------------------------
    # Save everything
    # --------------------------------------------------------

    db.commit()

    return generated