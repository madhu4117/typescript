
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.models.user import User
from app.models.sale import Sale
from app.utils.security import get_current_user


router = APIRouter(
    prefix="/sales-analytics",
    tags=["Sales Analytics"],
)


# =====================================================
# SALES DASHBOARD
# =====================================================

@router.get("/dashboard")
def sales_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company_id = current_user.company_id

    # Total Orders
    total_orders = (
        db.query(func.count(Sale.id))
        .filter(
            Sale.companyId == company_id
        )
        .scalar()
    )

    # Total Revenue
    total_revenue = (
        db.query(
            func.coalesce(
                func.sum(Sale.totalAmount),
                0,
            )
        )
        .filter(
            Sale.companyId == company_id
        )
        .scalar()
    )

    # Average Order Value
    average_order_value = (
        db.query(
            func.avg(Sale.totalAmount)
        )
        .filter(
            Sale.companyId == company_id
        )
        .scalar()
    )

    return {
        "totalOrders": total_orders or 0,
        "totalRevenue": float(total_revenue or 0),
        "averageOrderValue": round(
            float(average_order_value or 0),
            2,
        ),
    }


# =====================================================
# SALES GROWTH
# =====================================================

@router.get("/growth")
def sales_growth(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company_id = current_user.company_id

    results = (
        db.query(
            func.date_trunc(
                "month",
                Sale.saleDate,
            ).label("month"),
            func.count(Sale.id).label("orders"),
            func.coalesce(
                func.sum(Sale.totalAmount),
                0,
            ).label("revenue"),
        )
        .filter(
            Sale.companyId == company_id
        )
        .group_by(
            func.date_trunc(
                "month",
                Sale.saleDate,
            )
        )
        .order_by(
            func.date_trunc(
                "month",
                Sale.saleDate,
            )
        )
        .all()
    )

    return [
        {
            "month": row.month.strftime("%Y-%m"),
            "orders": row.orders,
            "revenue": float(row.revenue or 0),
        }
        for row in results
    ]


# =====================================================
# SALES BY CHANNEL
# =====================================================

@router.get("/by-channel")
def sales_by_channel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company_id = current_user.company_id

    results = (
        db.query(
            Sale.salesChannel.label("channel"),
            func.count(Sale.id).label("orders"),
            func.coalesce(
                func.sum(Sale.totalAmount),
                0,
            ).label("revenue"),
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
            "orders": row.orders,
            "revenue": float(row.revenue or 0),
        }
        for row in results
    ]


# =====================================================
# SALES BY PAYMENT METHOD
# =====================================================

@router.get("/by-payment-method")
def sales_by_payment_method(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company_id = current_user.company_id

    results = (
        db.query(
            Sale.paymentMethod.label("paymentMethod"),
            func.count(Sale.id).label("orders"),
            func.coalesce(
                func.sum(Sale.totalAmount),
                0,
            ).label("revenue"),
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
            "paymentMethod": row.paymentMethod,
            "orders": row.orders,
            "revenue": float(row.revenue or 0),
        }
        for row in results
    ]

