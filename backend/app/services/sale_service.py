from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.customer import Customer
from app.models.customer_purchase_summary import CustomerPurchaseSummary
from app.models.stock_movement import StockMovement

from app.schemas.sale_schema import SaleCreate
from app.utils.invoice import generate_invoice_number
from app.services.audit_service import log_event


class SaleService:

    # ==================================================
    # GET ALL SALES
    # ==================================================

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

    # ==================================================
    # GET SINGLE SALE
    # ==================================================

    @staticmethod
    def get_sale(
        db: Session,
        sale_id: int,
        company_id: int,
    ):

        sale = (
            db.query(Sale)
            .filter(
                Sale.id == sale_id,
                Sale.companyId == company_id,
            )
            .first()
        )

        if not sale:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sale not found",
            )

        return sale

    # ==================================================
    # CREATE SALE
    # ==================================================

    @staticmethod
    def create_sale(
        db: Session,
        sale_in: SaleCreate,
        company_id: int,
        performed_by: str,
    ):

        # ==================================================
        # VALIDATE CUSTOMER
        # ==================================================

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

        # ==================================================
        # VALIDATE ITEMS
        # ==================================================

        if not sale_in.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one product is required",
            )

        # ==================================================
        # GENERATE INVOICE
        # ==================================================

        invoice_number = generate_invoice_number(
            db=db,
            company_id=company_id,
        )

        # ==================================================
        # CREATE SALE
        # ==================================================

        sale = Sale(
            companyId=company_id,
            customerId=customer.id,
            customerName=(
                f"{customer.firstName} "
                f"{customer.lastName}"
            ),
            invoiceNumber=invoice_number,
            salesChannel=sale_in.salesChannel,
            paymentMethod=sale_in.paymentMethod,
            discount=sale_in.discount,
            tax=sale_in.tax,
            totalAmount=0,
            status="Completed",
            notes=sale_in.notes,
            createdBy=performed_by,
        )

        db.add(sale)

        db.flush()

        # ==================================================
        # TOTALS
        # ==================================================

        subtotal_amount = 0
        total_quantity = 0
        item_discount = 0
        item_tax = 0

        # ==================================================
        # CREATE SALE ITEMS
        # ==================================================

        for item in sale_in.items:

            # --------------------------------------------------
            # FIND PRODUCT
            # --------------------------------------------------

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
                    detail=(
                        f"Product {item.productId} "
                        f"not found"
                    ),
                )

            # --------------------------------------------------
            # QUANTITY VALIDATION
            # --------------------------------------------------

            if item.quantity <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Quantity must be greater "
                        "than zero"
                    ),
                )

            # --------------------------------------------------
            # STOCK VALIDATION
            # --------------------------------------------------

            if item.quantity > product.stockQuantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Only {product.stockQuantity} "
                        f"items available in stock "
                        f"for {product.name}"
                    ),
                )

            # --------------------------------------------------
            # PRICE VALIDATION
            # --------------------------------------------------

            if item.unitPrice < 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Unit price cannot be negative",
                )

            if item.discount < 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Discount cannot be negative",
                )

            if item.tax < 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Tax cannot be negative",
                )

            # --------------------------------------------------
            # CALCULATE LINE
            # --------------------------------------------------

            line_subtotal = (
                item.unitPrice *
                item.quantity
            )

            if item.discount > line_subtotal:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Discount cannot exceed "
                        "product value"
                    ),
                )

            line_total = (
                line_subtotal
                - item.discount
                + item.tax
            )

            # --------------------------------------------------
            # CREATE SALE ITEM
            # --------------------------------------------------

            sale_item = SaleItem(
                saleId=sale.id,
                productId=product.id,
                categoryId=item.categoryId,
                quantity=item.quantity,
                unitPrice=item.unitPrice,
                discount=item.discount,
                tax=item.tax,
                total=line_total,
            )

            db.add(sale_item)

            # --------------------------------------------------
            # STOCK MOVEMENT
            # --------------------------------------------------

            previous_stock = product.stockQuantity

            product.stockQuantity -= item.quantity

            new_stock = product.stockQuantity

            movement = StockMovement(
                companyId=company_id,
                productId=product.id,
                movementType="SALE",
                quantity=item.quantity,
                previousStock=previous_stock,
                newStock=new_stock,
                referenceType="Sale",
                referenceId=sale.id,
                unitPrice=item.unitPrice,
                notes=(
                    f"Stock reduced for invoice "
                    f"{sale.invoiceNumber}"
                ),
            )

            db.add(movement)

            # --------------------------------------------------
            # PRODUCT STATUS
            # --------------------------------------------------

            if product.stockQuantity == 0:
                product.status = "Out of Stock"

            # --------------------------------------------------
            # TOTALS
            # --------------------------------------------------

            subtotal_amount += line_subtotal
            item_discount += item.discount
            item_tax += item.tax
            total_quantity += item.quantity

        # ==================================================
        # FINAL BILLING
        # ==================================================

        final_discount = (
            item_discount +
            sale.discount
        )

        final_tax = (
            item_tax +
            sale.tax
        )

        grand_total = (
            subtotal_amount
            - final_discount
            + final_tax
        )

        if grand_total < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Final sale amount cannot be negative",
            )

        sale.totalAmount = grand_total

        db.flush()

        # ==================================================
        # CUSTOMER PURCHASE SUMMARY
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

        # ==================================================
        # CREATE SUMMARY
        # ==================================================

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

        # ==================================================
        # UPDATE SUMMARY
        # ==================================================

        purchase_summary.totalOrders += 1

        purchase_summary.totalRevenue += grand_total

        purchase_summary.totalQuantity += total_quantity

        purchase_summary.averageOrderValue = (
            purchase_summary.totalRevenue
            / purchase_summary.totalOrders
        )

        purchase_summary.purchaseFrequency = (
            purchase_summary.totalOrders
        )

        # ==================================================
        # PURCHASE DATES
        # ==================================================

        if (
            purchase_summary.firstPurchaseDate is None
            or sale.saleDate
            < purchase_summary.firstPurchaseDate
        ):
            purchase_summary.firstPurchaseDate = (
                sale.saleDate
            )

        if (
            purchase_summary.lastPurchaseDate is None
            or sale.saleDate
            > purchase_summary.lastPurchaseDate
        ):
            purchase_summary.lastPurchaseDate = (
                sale.saleDate
            )

        # ==================================================
        # CUSTOMER SEGMENT
        # ==================================================

        if purchase_summary.totalOrders >= 20:

            purchase_summary.customerSegment = "VIP"

        elif purchase_summary.totalOrders >= 10:

            purchase_summary.customerSegment = "Loyal"

        elif purchase_summary.totalOrders >= 2:

            purchase_summary.customerSegment = "Regular"

        else:

            purchase_summary.customerSegment = "New"

        # ==================================================
        # UPDATE CUSTOMER SEGMENT
        # ==================================================

        customer.customerSegment = (
            purchase_summary.customerSegment
        )

        # ==================================================
        # SAVE TRANSACTION
        # ==================================================

        db.commit()

        db.refresh(sale)

        # ==================================================
        # AUDIT LOG
        # ==================================================

        log_event(
            db=db,
            company_id=company_id,
            target_name=sale.invoiceNumber,
            action="Sale Created",
            performed_by=performed_by,
        )

        return sale