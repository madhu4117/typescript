from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db

from app.models.user import User
from app.models.customer import Customer, CustomerStatus
from app.models.customer_purchase_summary import CustomerPurchaseSummary

from app.utils.security import get_current_user


router = APIRouter(
    prefix="/customer-analytics",
    tags=["Customer Analytics"],
)


# =====================================================
# DASHBOARD KPI
# =====================================================

@router.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    company_id = current_user.company_id

    # Total Customers
    total_customers = (
        db.query(func.count(Customer.id))
        .filter(
            Customer.companyId == company_id
        )
        .scalar()
    )

    # Active Customers
    active_customers = (
        db.query(func.count(Customer.id))
        .filter(
            Customer.companyId == company_id,
            Customer.status == CustomerStatus.ACTIVE,
        )
        .scalar()
    )

    # New Customers
    new_customers = (
        db.query(func.count(CustomerPurchaseSummary.id))
        .filter(
            CustomerPurchaseSummary.companyId == company_id,
            CustomerPurchaseSummary.customerSegment == "New",
        )
        .scalar()
    )

    # Returning Customers
    returning_customers = (
        db.query(func.count(CustomerPurchaseSummary.id))
        .filter(
            CustomerPurchaseSummary.companyId == company_id,
            CustomerPurchaseSummary.totalOrders >= 2,
        )
        .scalar()
    )

    # Total Revenue
    total_revenue = (
        db.query(
            func.coalesce(
                func.sum(
                    CustomerPurchaseSummary.totalRevenue
                ),
                0,
            )
        )
        .filter(
            CustomerPurchaseSummary.companyId == company_id
        )
        .scalar()
    )

    # Average Customer Spend
    avg_spend = (
        db.query(
            func.avg(
                CustomerPurchaseSummary.totalRevenue
            )
        )
        .filter(
            CustomerPurchaseSummary.companyId == company_id
        )
        .scalar()
    )

    # Average Purchase Frequency
    avg_frequency = (
        db.query(
            func.avg(
                CustomerPurchaseSummary.totalOrders
            )
        )
        .filter(
            CustomerPurchaseSummary.companyId == company_id
        )
        .scalar()
    )

    return {
        "totalCustomers": total_customers or 0,
        "activeCustomers": active_customers or 0,
        "newCustomers": new_customers or 0,
        "returningCustomers": returning_customers or 0,
        "totalRevenue": float(total_revenue or 0),
        "averageCustomerSpend": round(
            float(avg_spend or 0),
            2,
        ),
        "averagePurchaseFrequency": round(
            float(avg_frequency or 0),
            2,
        ),
    }


# =====================================================
# CUSTOMER GROWTH TREND
# =====================================================

@router.get("/growth")
def customer_growth(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    company_id = current_user.company_id

    results = (
        db.query(
            func.date_trunc(
                "month",
                Customer.createdAt,
            ).label("month"),
            func.count(Customer.id).label("customers"),
        )
        .filter(
            Customer.companyId == company_id
        )
        .group_by(
            func.date_trunc(
                "month",
                Customer.createdAt,
            )
        )
        .order_by(
            func.date_trunc(
                "month",
                Customer.createdAt,
            )
        )
        .all()
    )

    return [
        {
            "month": row.month.strftime("%Y-%m"),
            "customers": row.customers,
        }
        for row in results
    ]


# =====================================================
# NEW VS RETURNING CUSTOMERS
# =====================================================

@router.get("/new-vs-returning")
def new_vs_returning(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    company_id = current_user.company_id

    new_customers = (
        db.query(
            func.count(CustomerPurchaseSummary.id)
        )
        .filter(
            CustomerPurchaseSummary.companyId == company_id,
            CustomerPurchaseSummary.totalOrders == 1,
        )
        .scalar()
    )

    returning_customers = (
        db.query(
            func.count(CustomerPurchaseSummary.id)
        )
        .filter(
            CustomerPurchaseSummary.companyId == company_id,
            CustomerPurchaseSummary.totalOrders >= 2,
        )
        .scalar()
    )

    return [
        {
            "type": "New",
            "customers": new_customers or 0,
        },
        {
            "type": "Returning",
            "customers": returning_customers or 0,
        },
    ]


# =====================================================
# REVENUE BY CUSTOMER TYPE
# =====================================================

@router.get("/revenue-by-type")
def revenue_by_customer_type(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    company_id = current_user.company_id

    results = (
        db.query(
            Customer.customerType.label("customerType"),
            func.coalesce(
                func.sum(
                    CustomerPurchaseSummary.totalRevenue
                ),
                0,
            ).label("revenue"),
        )
        .join(
            CustomerPurchaseSummary,
            Customer.id
            == CustomerPurchaseSummary.customerId,
        )
        .filter(
            Customer.companyId == company_id,
            CustomerPurchaseSummary.companyId == company_id,
        )
        .group_by(
            Customer.customerType
        )
        .all()
    )

    return [
        {
            "customerType": (
                row.customerType.value
                if hasattr(row.customerType, "value")
                else row.customerType
            ),
            "revenue": float(row.revenue or 0),
        }
        for row in results
    ]