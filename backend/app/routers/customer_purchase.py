from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.user import User
from app.models.customer import Customer
from app.models.customer_purchase_summary import CustomerPurchaseSummary
from app.models.sale import Sale
from app.models.sale_item import SaleItem

from app.utils.security import get_current_user


router = APIRouter(
    prefix="/customers",
    tags=["Customer Purchase History"],
)


# =========================================================
# GET CUSTOMER PURCHASE SUMMARY
# =========================================================

@router.get("/{customer_id}/purchase-summary")
def get_purchase_summary(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    company_id = current_user.company_id

    # -----------------------------------------------------
    # Find Customer
    # -----------------------------------------------------

    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id,
            Customer.companyId == company_id,
        )
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    # -----------------------------------------------------
    # Find Purchase Summary
    # -----------------------------------------------------

    summary = (
        db.query(CustomerPurchaseSummary)
        .filter(
            CustomerPurchaseSummary.customerId == customer_id,
            CustomerPurchaseSummary.companyId == company_id,
        )
        .first()
    )

    # -----------------------------------------------------
    # Customer has no purchases
    # -----------------------------------------------------

    if not summary:
        return {
            "customerId": customer.id,
            "customerName": customer.name,
            "totalOrders": 0,
            "totalRevenue": 0,
            "totalQuantity": 0,
            "averageOrderValue": 0,
            "firstPurchaseDate": None,
            "lastPurchaseDate": None,
            "frequentlyPurchasedProduct": None,
            "frequentlyPurchasedCategory": None,
            "customerSegment": "New",
        }

    return {
        "customerId": customer.id,
        "customerName": customer.name,

        "totalOrders": summary.totalOrders,
        "totalRevenue": summary.totalRevenue,
        "totalQuantity": summary.totalQuantity,
        "averageOrderValue": summary.averageOrderValue,

        "firstPurchaseDate": summary.firstPurchaseDate,
        "lastPurchaseDate": summary.lastPurchaseDate,

        "frequentlyPurchasedProduct":
            summary.frequentlyPurchasedProduct,

        "frequentlyPurchasedCategory":
            summary.frequentlyPurchasedCategory,

        "customerSegment":
            summary.customerSegment,
    }


# =========================================================
# GET CUSTOMER PURCHASE HISTORY
# =========================================================

@router.get("/{customer_id}/purchase-history")
def get_purchase_history(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    company_id = current_user.company_id

    # -----------------------------------------------------
    # Find Customer
    # -----------------------------------------------------

    customer = (
        db.query(Customer)
        .filter(
            Customer.id == customer_id,
            Customer.companyId == company_id,
        )
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    # -----------------------------------------------------
    # Get Sales
    # -----------------------------------------------------

    sales = (
        db.query(Sale)
        .filter(
            Sale.customerId == customer_id,
            Sale.companyId == company_id,
        )
        .order_by(
            Sale.saleDate.desc()
        )
        .all()
    )

    result = []

    # -----------------------------------------------------
    # Build Purchase History
    # -----------------------------------------------------

    for sale in sales:

        items = (
            db.query(SaleItem)
            .filter(
                SaleItem.saleId == sale.id
            )
            .all()
        )

        sale_items = []

        for item in items:

            sale_items.append({
                "productId": item.productId,
                "categoryId": item.categoryId,
                "quantity": item.quantity,
                "unitPrice": item.unitPrice,
                "discount": item.discount,
                "tax": item.tax,
                "total": item.total,
            })

        result.append({
            "saleId": sale.id,
            "invoiceNumber": sale.invoiceNumber,
            "saleDate": sale.saleDate,
            "salesChannel": sale.salesChannel,
            "paymentMethod": sale.paymentMethod,
            "totalAmount": sale.totalAmount,
            "items": sale_items,
        })

    return {
        "customerId": customer.id,
        "customerName": customer.name,
        "totalPurchases": len(result),
        "transactions": result,
    }