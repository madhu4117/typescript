from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.customer import Customer
from app.models.customer_purchase_summary import CustomerPurchaseSummary

from app.schemas.sale_schema import SaleCreate
from app.utils.invoice import generate_invoice_number
from app.services.audit_service import log_event


class SaleService:

    # --------------------------------------------------
    # GET ALL SALES
    # --------------------------------------------------

    @staticmethod
    def get_sales(
        db: Session,
        company_id: int,
    ):

        return (
            db.query(Sale)
            .filter(
                Sale.companyId == company_id
            )
            .order_by(
                Sale.id.desc()
            )
            .all()
        )

    # --------------------------------------------------
    # CREATE SALE
    # --------------------------------------------------

    @staticmethod
    def create_sale(
        db: Session,
        sale_in: SaleCreate,
        company_id: int,
        performed_by: str,
    ):

        # --------------------------------------------------
        # Find Customer
        # --------------------------------------------------

        customer = (
            db.query(Customer)
            .filter(
                Customer.id == sale_in.customerId,
                Customer.companyId == company_id,
            )
            .first()
        )

        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found",
            )

        # --------------------------------------------------
        # Generate Invoice
        # --------------------------------------------------

        invoice_number = generate_invoice_number(
            db=db,
            company_id=company_id,
        )

        total_amount = 0
        total_quantity = 0

        # --------------------------------------------------
        # Create Sale
        # --------------------------------------------------

        sale = Sale(
            companyId=company_id,
            customerId=customer.id,
            customerName=customer.name,
            invoiceNumber=invoice_number,
            salesChannel=sale_in.salesChannel,
            paymentMethod=sale_in.paymentMethod,
            totalAmount=0,
            createdBy=performed_by,
        )

        db.add(sale)

        db.flush()

        # --------------------------------------------------
        # Make sure sale date is available
        # --------------------------------------------------

        db.refresh(sale)

        # --------------------------------------------------
        # Create Sale Items
        # --------------------------------------------------

        for item in sale_in.items:

            product = (
                db.query(Product)
                .filter(
                    Product.id == item.productId,
                    Product.companyId == company_id,
                )
                .first()
            )

            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product {item.productId} not found",
                )

            # --------------------------------------------------
            # Validate Quantity
            # --------------------------------------------------

            if item.quantity <= 0:

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Quantity must be greater than zero",
                )

            # --------------------------------------------------
            # Check Stock
            # --------------------------------------------------

            if item.quantity > product.stockQuantity:

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Only {product.stockQuantity} "
                        f"items available in stock"
                    ),
                )

            # --------------------------------------------------
            # Calculate Subtotal
            # --------------------------------------------------

            subtotal = (
                item.unitPrice *
                item.quantity
            )

            # --------------------------------------------------
            # Validate Discount
            # --------------------------------------------------

            if item.discount > subtotal:

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Discount cannot exceed product value",
                )

            # --------------------------------------------------
            # Calculate Total
            # --------------------------------------------------

            total = (
                subtotal
                - item.discount
                + item.tax
            )

            # --------------------------------------------------
            # Create Sale Item
            # --------------------------------------------------

            sale_item = SaleItem(
                saleId=sale.id,
                productId=item.productId,
                categoryId=item.categoryId,
                quantity=item.quantity,
                unitPrice=item.unitPrice,
                discount=item.discount,
                tax=item.tax,
                total=total,
            )

            db.add(sale_item)

            # --------------------------------------------------
            # Update Inventory
            # --------------------------------------------------

            product.stockQuantity -= item.quantity

            if product.stockQuantity == 0:
                product.status = "Out of Stock"

            total_amount += total
            total_quantity += item.quantity

        # --------------------------------------------------
        # Update Sale Total
        # --------------------------------------------------

        sale.totalAmount = total_amount

        db.flush()

        # ==================================================
        # UPDATE CUSTOMER PURCHASE SUMMARY
        # ==================================================

        purchase_summary = (
            db.query(CustomerPurchaseSummary)
            .filter(
                CustomerPurchaseSummary.customerId
                == customer.id,

                CustomerPurchaseSummary.companyId
                == company_id,
            )
            .first()
        )

        # --------------------------------------------------
        # Create Summary If First Purchase
        # --------------------------------------------------

        if not purchase_summary:

            purchase_summary = CustomerPurchaseSummary(
            companyId=company_id,
            customerId=customer.id,

            totalOrders=0,
            totalRevenue=0,
            totalQuantity=0,
            averageOrderValue=0,
            purchaseFrequency=0,

            firstPurchaseDate=sale.saleDate,
            lastPurchaseDate=sale.saleDate,

            customerSegment="New",
            )

            db.add(purchase_summary)

            db.flush()

        # --------------------------------------------------
        # Update Summary
        # --------------------------------------------------

        purchase_summary.totalOrders += 1

        purchase_summary.totalRevenue += total_amount

        purchase_summary.totalQuantity += total_quantity

        purchase_summary.averageOrderValue = (
            purchase_summary.totalRevenue
            / purchase_summary.totalOrders
        )
        
        purchase_summary.purchaseFrequency = (
          purchase_summary.totalOrders
        )

        # --------------------------------------------------
        # First Purchase Date
        # --------------------------------------------------

        if (
            purchase_summary.firstPurchaseDate is None
            or sale.saleDate
            < purchase_summary.firstPurchaseDate
        ):

            purchase_summary.firstPurchaseDate = (
                sale.saleDate
            )

        # --------------------------------------------------
        # Last Purchase Date
        # --------------------------------------------------

        if (
            purchase_summary.lastPurchaseDate is None
            or sale.saleDate
            > purchase_summary.lastPurchaseDate
        ):

            purchase_summary.lastPurchaseDate = (
                sale.saleDate
            )

        # --------------------------------------------------
        # Customer Segmentation
        # --------------------------------------------------

        if purchase_summary.totalOrders >= 20:

            purchase_summary.customerSegment = "VIP"

        elif purchase_summary.totalOrders >= 10:

            purchase_summary.customerSegment = "Loyal"

        elif purchase_summary.totalOrders >= 2:

            purchase_summary.customerSegment = "Regular"

        else:

            purchase_summary.customerSegment = "New"

        # --------------------------------------------------
        # Save Everything
        # --------------------------------------------------

        db.commit()

        db.refresh(sale)

        # --------------------------------------------------
        # Audit Log
        # --------------------------------------------------

        log_event(
            db=db,
            company_id=company_id,
            target_name=sale.invoiceNumber,
            action="Sale Created",
            performed_by=performed_by,
        )

        return sale