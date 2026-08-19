import csv
import io
from datetime import date, datetime, timedelta
from typing import Optional, List

from fastapi import APIRouter, Depends, Query, Response, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.models.user import User
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product
from app.models.customer import Customer
from app.utils.security import get_current_user
from app.services.audit_service import log_event

router = APIRouter(
    prefix="/api/analytics/sales",
    tags=["Sales Analytics"],
)


# =====================================================
# QUERY HELPERS FOR REUSE AND DRY CODE
# =====================================================

def sales_summary_data(
    db: Session,
    company_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    product_id: Optional[int] = None,
    category_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    payment_method: Optional[str] = None,
):
    # Base query for Sale table to calculate overall metrics
    sale_query = db.query(
        func.coalesce(func.sum(Sale.totalAmount), 0).label("total_revenue"),
        func.count(Sale.id).label("total_orders"),
        func.coalesce(func.sum(Sale.discount), 0).label("total_discount"),
        func.coalesce(func.sum(Sale.tax), 0).label("total_tax")
    ).filter(Sale.companyId == company_id)

    if start_date:
        sale_query = sale_query.filter(Sale.saleDate >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        sale_query = sale_query.filter(Sale.saleDate < datetime.combine(end_date + timedelta(days=1), datetime.min.time()))
    if customer_id:
        sale_query = sale_query.filter(Sale.customerId == customer_id)
    if payment_method:
        sale_query = sale_query.filter(Sale.paymentMethod == payment_method)

    # Use EXISTS subquery to filter sales by product or category without duplicate items duplicating totalAmounts
    if product_id or category_id:
        subq = db.query(SaleItem.saleId).filter(SaleItem.saleId == Sale.id)
        if product_id:
            subq = subq.filter(SaleItem.productId == product_id)
        if category_id:
            subq = subq.filter(SaleItem.categoryId == category_id)
        sale_query = sale_query.filter(subq.exists())

    sale_res = sale_query.first()

    # Query items count on SaleItem table
    item_query = db.query(
        func.coalesce(func.sum(SaleItem.quantity), 0)
    ).join(Sale, Sale.id == SaleItem.saleId).filter(Sale.companyId == company_id)

    if start_date:
        item_query = item_query.filter(Sale.saleDate >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        item_query = item_query.filter(Sale.saleDate < datetime.combine(end_date + timedelta(days=1), datetime.min.time()))
    if customer_id:
        item_query = item_query.filter(Sale.customerId == customer_id)
    if payment_method:
        item_query = item_query.filter(Sale.paymentMethod == payment_method)
    if product_id:
        item_query = item_query.filter(SaleItem.productId == product_id)
    if category_id:
        item_query = item_query.filter(SaleItem.categoryId == category_id)

    total_items_sold = item_query.scalar() or 0

    total_revenue = float(sale_res.total_revenue)
    total_orders = int(sale_res.total_orders)
    total_discount = float(sale_res.total_discount)
    total_tax = float(sale_res.total_tax)
    average_order_value = total_revenue / total_orders if total_orders > 0 else 0.0

    return {
        "totalRevenue": round(total_revenue, 2),
        "totalOrders": total_orders,
        "averageOrderValue": round(average_order_value, 2),
        "totalItemsSold": total_items_sold,
        "totalDiscount": round(total_discount, 2),
        "totalTax": round(total_tax, 2)
    }


def sales_products_data(
    db: Session,
    company_id: int,
    sort_by: str = "revenue",
    limit: int = 10,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    payment_method: Optional[str] = None,
):
    product_query = db.query(
        Product.id.label("product_id"),
        Product.name.label("product_name"),
        func.coalesce(func.sum(SaleItem.quantity), 0).label("quantity_sold"),
        func.coalesce(func.sum(SaleItem.total), 0).label("revenue")
    ).join(SaleItem, SaleItem.productId == Product.id).join(Sale, Sale.id == SaleItem.saleId).filter(Sale.companyId == company_id)

    if start_date:
        product_query = product_query.filter(Sale.saleDate >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        product_query = product_query.filter(Sale.saleDate < datetime.combine(end_date + timedelta(days=1), datetime.min.time()))
    if customer_id:
        product_query = product_query.filter(Sale.customerId == customer_id)
    if payment_method:
        product_query = product_query.filter(Sale.paymentMethod == payment_method)
    if category_id:
        product_query = product_query.filter(SaleItem.categoryId == category_id)

    product_query = product_query.group_by(Product.id, Product.name)

    if sort_by == "quantity":
        product_query = product_query.order_by(func.coalesce(func.sum(SaleItem.quantity), 0).desc())
    else:
        product_query = product_query.order_by(func.coalesce(func.sum(SaleItem.total), 0).desc())

    product_query = product_query.limit(limit)
    rows = product_query.all()

    return [
        {
            "productId": row.product_id,
            "productName": row.product_name,
            "quantitySold": int(row.quantity_sold),
            "revenue": float(row.revenue)
        }
        for row in rows
    ]


def sales_customers_data(
    db: Session,
    company_id: int,
    limit: int = 10,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    product_id: Optional[int] = None,
    category_id: Optional[int] = None,
    payment_method: Optional[str] = None,
):
    customer_query = db.query(
        Customer.id.label("customer_id"),
        func.concat(Customer.firstName, " ", Customer.lastName).label("customer_name"),
        func.count(Sale.id.distinct()).label("orders"),
        func.coalesce(func.sum(Sale.totalAmount), 0).label("total_spend")
    ).join(Sale, Sale.customerId == Customer.id).filter(Sale.companyId == company_id)

    if start_date:
        customer_query = customer_query.filter(Sale.saleDate >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        customer_query = customer_query.filter(Sale.saleDate < datetime.combine(end_date + timedelta(days=1), datetime.min.time()))
    if payment_method:
        customer_query = customer_query.filter(Sale.paymentMethod == payment_method)

    if product_id or category_id:
        subq = db.query(SaleItem.saleId).filter(SaleItem.saleId == Sale.id)
        if product_id:
            subq = subq.filter(SaleItem.productId == product_id)
        if category_id:
            subq = subq.filter(SaleItem.categoryId == category_id)
        customer_query = customer_query.filter(subq.exists())

    customer_query = customer_query.group_by(Customer.id, Customer.firstName, Customer.lastName)
    customer_query = customer_query.order_by(func.coalesce(func.sum(Sale.totalAmount), 0).desc())
    customer_query = customer_query.limit(limit)

    rows = customer_query.all()

    return [
        {
            "customerId": row.customer_id,
            "customerName": row.customer_name,
            "orders": int(row.orders),
            "totalSpend": float(row.total_spend),
            "averageOrderValue": round(float(row.total_spend) / int(row.orders), 2) if int(row.orders) > 0 else 0.0
        }
        for row in rows
    ]


# =====================================================
# ENDPOINTS
# =====================================================

@router.get("/summary")
def get_sales_summary(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    product_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    customer_id: Optional[int] = Query(None),
    payment_method: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return sales_summary_data(
        db=db,
        company_id=current_user.company_id,
        start_date=start_date,
        end_date=end_date,
        product_id=product_id,
        category_id=category_id,
        customer_id=customer_id,
        payment_method=payment_method
    )


@router.get("/trend")
def get_sales_trend(
    period: str = Query("daily", pattern="^(daily|weekly|monthly)$"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    product_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    customer_id: Optional[int] = Query(None),
    payment_method: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company_id = current_user.company_id

    if period == "monthly":
        date_group = func.date_trunc("month", Sale.saleDate)
    elif period == "weekly":
        date_group = func.date_trunc("week", Sale.saleDate)
    else:
        date_group = func.date(Sale.saleDate)

    trend_query = db.query(
        date_group.label("date"),
        func.coalesce(func.sum(Sale.totalAmount), 0).label("revenue"),
        func.count(Sale.id).label("orders")
    ).filter(Sale.companyId == company_id)

    if start_date:
        trend_query = trend_query.filter(Sale.saleDate >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        trend_query = trend_query.filter(Sale.saleDate < datetime.combine(end_date + timedelta(days=1), datetime.min.time()))
    if customer_id:
        trend_query = trend_query.filter(Sale.customerId == customer_id)
    if payment_method:
        trend_query = trend_query.filter(Sale.paymentMethod == payment_method)

    if product_id or category_id:
        subq = db.query(SaleItem.saleId).filter(SaleItem.saleId == Sale.id)
        if product_id:
            subq = subq.filter(SaleItem.productId == product_id)
        if category_id:
            subq = subq.filter(SaleItem.categoryId == category_id)
        trend_query = trend_query.filter(subq.exists())

    trend_query = trend_query.group_by(date_group).order_by(date_group)
    results = trend_query.all()

    return [
        {
            "date": row.date.strftime("%Y-%m-%d") if isinstance(row.date, (datetime, date)) else str(row.date),
            "revenue": float(row.revenue),
            "orders": int(row.orders)
        }
        for row in results
    ]


@router.get("/products")
def get_sales_products(
    sort_by: str = Query("revenue", pattern="^(revenue|quantity)$"),
    limit: int = Query(10),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    category_id: Optional[int] = Query(None),
    customer_id: Optional[int] = Query(None),
    payment_method: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return sales_products_data(
        db=db,
        company_id=current_user.company_id,
        sort_by=sort_by,
        limit=limit,
        start_date=start_date,
        end_date=end_date,
        category_id=category_id,
        customer_id=customer_id,
        payment_method=payment_method
    )


@router.get("/customers")
def get_sales_customers(
    limit: int = Query(10),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    product_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    payment_method: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return sales_customers_data(
        db=db,
        company_id=current_user.company_id,
        limit=limit,
        start_date=start_date,
        end_date=end_date,
        product_id=product_id,
        category_id=category_id,
        payment_method=payment_method
    )


@router.get("/payment-methods")
def get_sales_payment_methods(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    product_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    customer_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company_id = current_user.company_id

    payment_query = db.query(
        Sale.paymentMethod.label("payment_method"),
        func.count(Sale.id).label("transactions"),
        func.coalesce(func.sum(Sale.totalAmount), 0).label("revenue")
    ).filter(Sale.companyId == company_id)

    if start_date:
        payment_query = payment_query.filter(Sale.saleDate >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        payment_query = payment_query.filter(Sale.saleDate < datetime.combine(end_date + timedelta(days=1), datetime.min.time()))
    if customer_id:
        payment_query = payment_query.filter(Sale.customerId == customer_id)

    if product_id or category_id:
        subq = db.query(SaleItem.saleId).filter(SaleItem.saleId == Sale.id)
        if product_id:
            subq = subq.filter(SaleItem.productId == product_id)
        if category_id:
            subq = subq.filter(SaleItem.categoryId == category_id)
        payment_query = payment_query.filter(subq.exists())

    payment_query = payment_query.group_by(Sale.paymentMethod).order_by(func.coalesce(func.sum(Sale.totalAmount), 0).desc())
    results = payment_query.all()

    return [
        {
            "paymentMethod": row.payment_method,
            "transactions": int(row.transactions),
            "revenue": float(row.revenue)
        }
        for row in results
    ]


# =====================================================
# EXPORTS
# =====================================================

@router.get("/export/csv")
def export_sales_csv(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    product_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    customer_id: Optional[int] = Query(None),
    payment_method: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company_id = current_user.company_id
    summary = sales_summary_data(db, company_id, start_date, end_date, product_id, category_id, customer_id, payment_method)

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["Sales Analytics Report"])
    writer.writerow(["Generated on", datetime.now().strftime("%Y-%m-%d %H:%M:%S")])
    writer.writerow(["Company ID", company_id])
    if start_date:
        writer.writerow(["Start Date", start_date.strftime("%Y-%m-%d")])
    if end_date:
        writer.writerow(["End Date", end_date.strftime("%Y-%m-%d")])
    writer.writerow([])

    writer.writerow(["KPI Metrics Summary"])
    writer.writerow(["Total Revenue (INR)", summary["totalRevenue"]])
    writer.writerow(["Total Orders", summary["totalOrders"]])
    writer.writerow(["Average Order Value (INR)", summary["averageOrderValue"]])
    writer.writerow(["Total Items Sold", summary["totalItemsSold"]])
    writer.writerow(["Total Discount (INR)", summary["totalDiscount"]])
    writer.writerow(["Total Tax (INR)", summary["totalTax"]])
    writer.writerow([])

    writer.writerow(["Top Performing Products (Limit 20)"])
    products = sales_products_data(db, company_id, "revenue", 20, start_date, end_date, category_id, customer_id, payment_method)
    writer.writerow(["Product ID", "Product Name", "Quantity Sold", "Revenue (INR)"])
    for p in products:
        writer.writerow([p["productId"], p["productName"], p["quantitySold"], p["revenue"]])
    writer.writerow([])

    writer.writerow(["Top Customer Revenue Analysis (Limit 20)"])
    customers = sales_customers_data(db, company_id, 20, start_date, end_date, product_id, category_id, payment_method)
    writer.writerow(["Customer ID", "Customer Name", "Orders Count", "Total Spend (INR)", "Average Order Value (INR)"])
    for c in customers:
        writer.writerow([c["customerId"], c["customerName"], c["orders"], c["totalSpend"], c["averageOrderValue"]])

    # Log audit log event
    log_event(
        db=db,
        company_id=company_id,
        target_name="Sales Analytics Dashboard",
        action="Export CSV",
        performed_by=f"{current_user.name} ({current_user.email})",
    )

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=sales_analytics_{datetime.now().strftime('%Y%m%d%H%M%S')}.csv"
        },
    )


@router.get("/export/pdf")
def export_sales_pdf(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    product_id: Optional[int] = Query(None),
    category_id: Optional[int] = Query(None),
    customer_id: Optional[int] = Query(None),
    payment_method: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company_id = current_user.company_id
    summary = sales_summary_data(db, company_id, start_date, end_date, product_id, category_id, customer_id, payment_method)
    products = sales_products_data(db, company_id, "revenue", 10, start_date, end_date, category_id, customer_id, payment_method)
    customers = sales_customers_data(db, company_id, 10, start_date, end_date, product_id, category_id, payment_method)

    buffer = io.BytesIO()
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors

    pdf = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()

    # Custom styling
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=15
    )
    section_style = ParagraphStyle(
        'DocSection',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=12,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['BodyText'],
        fontSize=10,
        textColor=colors.HexColor("#334155")
    )

    story = []
    story.append(Paragraph("Sales Analytics Executive Report", title_style))
    meta_text = f"Report Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Company ID: {company_id}"
    if start_date or end_date:
        meta_text += f" | Period: {start_date or 'Beginning'} to {end_date or 'Today'}"
    story.append(Paragraph(meta_text, body_style))
    story.append(Spacer(1, 15))

    # KPI Table
    story.append(Paragraph("KPI Performance Summary", section_style))
    kpi_data = [
        ["Metric", "Value"],
        ["Total Revenue", f"INR {summary['totalRevenue']:,.2f}"],
        ["Total Orders", f"{summary['totalOrders']:,}"],
        ["Average Order Value", f"INR {summary['averageOrderValue']:,.2f}"],
        ["Total Items Sold", f"{summary['totalItemsSold']:,}"],
        ["Total Discount Issued", f"INR {summary['totalDiscount']:,.2f}"],
        ["Total Tax Collected", f"INR {summary['totalTax']:,.2f}"]
    ]
    t_kpi = Table(kpi_data, colWidths=[200, 200])
    t_kpi.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
    ]))
    story.append(t_kpi)
    story.append(Spacer(1, 15))

    # Top Products
    story.append(Paragraph("Top Performing Products (Limit 10)", section_style))
    prod_data = [["Product ID", "Product Name", "Qty Sold", "Revenue"]]
    for p in products:
        prod_data.append([str(p["productId"]), p["productName"], f"{p['quantitySold']:,}", f"INR {p['revenue']:,.2f}"])
    t_prod = Table(prod_data, colWidths=[80, 200, 80, 120])
    t_prod.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
    ]))
    story.append(t_prod)
    story.append(Spacer(1, 15))

    # Top Customers
    story.append(Paragraph("Top Customer Contribution (Limit 10)", section_style))
    cust_data = [["Customer ID", "Customer Name", "Orders", "Total Spend", "AOV"]]
    for c in customers:
        cust_data.append([str(c["customerId"]), c["customerName"], f"{c['orders']:,}", f"INR {c['totalSpend']:,.2f}", f"INR {c['averageOrderValue']:,.2f}"])
    t_cust = Table(cust_data, colWidths=[80, 180, 60, 100, 100])
    t_cust.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
    ]))
    story.append(t_cust)

    pdf.build(story)
    buffer.seek(0)
    pdf_data = buffer.read()

    # Log audit log event
    log_event(
        db=db,
        company_id=company_id,
        target_name="Sales Analytics Dashboard",
        action="Export PDF",
        performed_by=f"{current_user.name} ({current_user.email})",
    )

    return Response(
        content=pdf_data,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=sales_analytics_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
        },
    )
