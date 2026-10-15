import math
from datetime import date, datetime, time, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.customer import Customer
from app.models.inventory import Inventory
from app.models.inventory_movement import InventoryMovement
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem


REPORT_NAMES = {
    "sales": "Sales Report",
    "inventory": "Inventory Report",
    "customer": "Customer Report",
    "product_performance": "Product Performance Report",
    "stock_movement": "Stock Movement Report",
}


def _parse_date(d: Any) -> Optional[date]:
    if not d:
        return None
    if isinstance(d, date) and not isinstance(d, datetime):
        return d
    if isinstance(d, datetime):
        return d.date()
    if isinstance(d, str):
        try:
            return datetime.strptime(d[:10], "%Y-%m-%d").date()
        except Exception:
            return None
    return None


def _apply_date_filter(query, column, filters: Dict[str, Any]):
    from_date = _parse_date(filters.get("fromDate"))
    if from_date:
        start = datetime.combine(from_date, time.min).replace(tzinfo=timezone.utc)
        query = query.filter(column >= start)

    to_date = _parse_date(filters.get("toDate"))
    if to_date:
        end = datetime.combine(to_date, time.max).replace(tzinfo=timezone.utc)
        query = query.filter(column <= end)

    return query


def generate_sales_report(
    db: Session,
    company_id: int,
    filters: Dict[str, Any],
) -> List[Dict[str, Any]]:
    query = (
        db.query(
            Sale.id,
            Sale.invoiceNumber,
            Sale.saleDate,
            Sale.customerName,
            Sale.salesChannel,
            Sale.paymentMethod,
            Sale.status,
            Sale.totalAmount,
            Sale.createdBy,
        )
        .filter(Sale.companyId == company_id)
    )

    query = _apply_date_filter(query, Sale.saleDate, filters)

    if filters.get("customerId"):
        query = query.filter(Sale.customerId == filters["customerId"])

    if filters.get("salesStatus"):
        query = query.filter(Sale.status == filters["salesStatus"])

    if filters.get("productId") or filters.get("categoryId") or filters.get("brand"):
        query = query.join(SaleItem, SaleItem.saleId == Sale.id)
        if filters.get("productId"):
            query = query.filter(SaleItem.productId == filters["productId"])
        if filters.get("categoryId"):
            query = query.filter(SaleItem.categoryId == filters["categoryId"])
        if filters.get("brand"):
            query = query.join(Product, Product.id == SaleItem.productId).filter(
                Product.brand == filters["brand"]
            )
        query = query.distinct()

    rows = query.order_by(Sale.saleDate.desc()).all()

    return [
        {
            "id": row.id,
            "invoiceNumber": row.invoiceNumber,
            "saleDate": row.saleDate.strftime("%Y-%m-%d %H:%M") if row.saleDate else "",
            "customerName": row.customerName,
            "salesChannel": row.salesChannel,
            "paymentMethod": row.paymentMethod,
            "status": row.status,
            "totalAmount": round(float(row.totalAmount or 0), 2),
            "createdBy": row.createdBy,
        }
        for row in rows
    ]


def generate_inventory_report(
    db: Session,
    company_id: int,
    filters: Dict[str, Any],
) -> List[Dict[str, Any]]:
    query = (
        db.query(
            Product.id,
            Product.name,
            Product.sku,
            Product.brand,
            Category.name.label("categoryName"),
            Inventory.currentStock,
            Inventory.reservedStock,
            Inventory.availableStock,
            Inventory.reorderLevel,
            Inventory.stockStatus,
        )
        .join(Inventory, Inventory.productId == Product.id)
        .join(Category, Category.id == Product.categoryId)
        .filter(
            Product.companyId == company_id,
            Inventory.companyId == company_id,
        )
    )

    if filters.get("productId"):
        query = query.filter(Product.id == filters["productId"])

    if filters.get("categoryId"):
        query = query.filter(Product.categoryId == filters["categoryId"])

    if filters.get("brand"):
        query = query.filter(Product.brand == filters["brand"])

    if filters.get("stockStatus"):
        query = query.filter(Inventory.stockStatus == filters["stockStatus"])

    rows = query.order_by(Product.name.asc()).all()

    return [
        {
            "id": row.id,
            "productName": row.name,
            "sku": row.sku,
            "brand": row.brand or "—",
            "categoryName": row.categoryName,
            "currentStock": row.currentStock,
            "reservedStock": row.reservedStock,
            "availableStock": row.availableStock,
            "reorderLevel": row.reorderLevel,
            "stockStatus": row.stockStatus,
        }
        for row in rows
    ]


def generate_customer_report(
    db: Session,
    company_id: int,
    filters: Dict[str, Any],
) -> List[Dict[str, Any]]:
    query = (
        db.query(
            Customer.id,
            Customer.firstName,
            Customer.lastName,
            Customer.email,
            Customer.phone,
            Customer.customerType,
            Customer.customerSegment,
            Customer.status,
            func.count(Sale.id).label("purchaseCount"),
            func.coalesce(func.sum(Sale.totalAmount), 0).label("totalPurchaseAmount"),
        )
        .outerjoin(Sale, (Sale.customerId == Customer.id) & (Sale.companyId == company_id))
        .filter(Customer.companyId == company_id)
        .group_by(
            Customer.id,
            Customer.firstName,
            Customer.lastName,
            Customer.email,
            Customer.phone,
            Customer.customerType,
            Customer.customerSegment,
            Customer.status,
        )
    )

    if filters.get("customerId"):
        query = query.filter(Customer.id == filters["customerId"])

    from_date = _parse_date(filters.get("fromDate"))
    if from_date:
        start = datetime.combine(from_date, time.min).replace(tzinfo=timezone.utc)
        query = query.filter((Sale.saleDate >= start) | (Sale.id == None))

    to_date = _parse_date(filters.get("toDate"))
    if to_date:
        end = datetime.combine(to_date, time.max).replace(tzinfo=timezone.utc)
        query = query.filter((Sale.saleDate <= end) | (Sale.id == None))

    if filters.get("customerType"):
        query = query.filter(Customer.customerType == filters["customerType"])

    if filters.get("customerSegment"):
        query = query.filter(Customer.customerSegment == filters["customerSegment"])

    rows = query.order_by(Customer.firstName.asc()).all()

    return [
        {
            "id": row.id,
            "customerName": f"{row.firstName} {row.lastName}".strip(),
            "email": row.email,
            "phone": row.phone,
            "customerType": getattr(row.customerType, "value", str(row.customerType))
            if row.customerType
            else "—",
            "customerSegment": getattr(row.customerSegment, "value", str(row.customerSegment))
            if row.customerSegment
            else "—",
            "status": getattr(row.status, "value", str(row.status)) if row.status else "—",
            "purchaseCount": row.purchaseCount,
            "totalPurchaseAmount": round(float(row.totalPurchaseAmount or 0), 2),
        }
        for row in rows
    ]


def generate_product_performance_report(
    db: Session,
    company_id: int,
    filters: Dict[str, Any],
) -> List[Dict[str, Any]]:
    query = (
        db.query(
            Product.id,
            Product.name,
            Product.sku,
            Product.brand,
            Category.name.label("categoryName"),
            func.coalesce(func.sum(SaleItem.quantity), 0).label("quantitySold"),
            func.coalesce(func.sum(SaleItem.total), 0).label("revenue"),
        )
        .join(SaleItem, SaleItem.productId == Product.id)
        .join(Sale, Sale.id == SaleItem.saleId)
        .join(Category, Category.id == Product.categoryId)
        .filter(
            Product.companyId == company_id,
            Sale.companyId == company_id,
        )
        .group_by(
            Product.id,
            Product.name,
            Product.sku,
            Product.brand,
            Category.name,
        )
    )

    query = _apply_date_filter(query, Sale.saleDate, filters)

    if filters.get("productId"):
        query = query.filter(Product.id == filters["productId"])

    if filters.get("categoryId"):
        query = query.filter(Product.categoryId == filters["categoryId"])

    if filters.get("brand"):
        query = query.filter(Product.brand == filters["brand"])

    rows = query.order_by(func.sum(SaleItem.total).desc()).all()

    return [
        {
            "id": row.id,
            "productName": row.name,
            "sku": row.sku,
            "brand": row.brand or "—",
            "categoryName": row.categoryName,
            "quantitySold": int(row.quantitySold),
            "revenue": round(float(row.revenue or 0), 2),
        }
        for row in rows
    ]


def generate_stock_movement_report(
    db: Session,
    company_id: int,
    filters: Dict[str, Any],
) -> List[Dict[str, Any]]:
    query = (
        db.query(
            InventoryMovement.id,
            InventoryMovement.movementType,
            InventoryMovement.quantityChanged,
            InventoryMovement.previousQuantity,
            InventoryMovement.updatedQuantity,
            InventoryMovement.reason,
            InventoryMovement.remarks,
            InventoryMovement.createdAt,
            Product.name.label("productName"),
            Product.sku,
            Product.brand,
        )
        .join(Inventory, Inventory.id == InventoryMovement.inventoryId)
        .join(Product, Product.id == Inventory.productId)
        .filter(
            Inventory.companyId == company_id,
            Product.companyId == company_id,
        )
    )

    query = _apply_date_filter(query, InventoryMovement.createdAt, filters)

    if filters.get("productId"):
        query = query.filter(Product.id == filters["productId"])

    if filters.get("categoryId"):
        query = query.filter(Product.categoryId == filters["categoryId"])

    if filters.get("brand"):
        query = query.filter(Product.brand == filters["brand"])

    rows = query.order_by(InventoryMovement.createdAt.desc()).all()

    return [
        {
            "id": row.id,
            "productName": row.productName,
            "sku": row.sku,
            "brand": row.brand or "—",
            "movementType": row.movementType,
            "quantityChanged": row.quantityChanged,
            "previousQuantity": row.previousQuantity,
            "updatedQuantity": row.updatedQuantity,
            "reason": row.reason or "—",
            "remarks": row.remarks or "—",
            "createdAt": row.createdAt.strftime("%Y-%m-%d %H:%M") if row.createdAt else "",
        }
        for row in rows
    ]


def generate_report(
    db: Session,
    company_id: int,
    report_type: str,
    filters: Dict[str, Any],
) -> List[Dict[str, Any]]:
    report_type = report_type.lower()
    if report_type == "sales":
        return generate_sales_report(db, company_id, filters)
    if report_type == "inventory":
        return generate_inventory_report(db, company_id, filters)
    if report_type == "customer":
        return generate_customer_report(db, company_id, filters)
    if report_type == "product_performance":
        return generate_product_performance_report(db, company_id, filters)
    if report_type == "stock_movement":
        return generate_stock_movement_report(db, company_id, filters)

    raise ValueError(f"Invalid report type: {report_type}")