from fastapi import (
    HTTPException,
    status,
)

from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.customer import Customer
from app.models.customer_purchase_summary import (
    CustomerPurchaseSummary,
)
from app.models.stock_movement import StockMovement

from app.schemas.sale_schema import SaleCreate

from app.utils.invoice import generate_invoice_number

from app.services.audit_service import log_event


class SaleService:

    # =========================================================
    # GET ALL SALES
    # =========================================================

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

    # =========================================================
    # GET SINGLE SALE
    # =========================================================

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

    # =========================================================
    # CREATE SALE
    # =========================================================

    @staticmethod
    def create_sale(
        db: Session,
        sale_in: SaleCreate,
        company_id: int,
        performed_by: str,
    ):

        try:

            # =================================================
            # VALIDATE SALE DISCOUNT
            # =================================================

            sale_discount = float(
                sale_in.discount or 0
            )

            sale_tax = float(
                sale_in.tax or 0
            )

            if sale_discount < 0:

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Sale discount cannot be negative",
                )

            if sale_tax < 0:

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Sale tax cannot be negative",
                )

            # =================================================
            # VALIDATE CUSTOMER
            # =================================================

            customer = (
                db.query(Customer)
                .filter(
                    Customer.id
                    == sale_in.customerId,

                    Customer.companyId
                    == company_id,
                )
                .first()
            )

            if not customer:

                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Customer not found",
                )

            # =================================================
            # VALIDATE ITEMS
            # =================================================

            if not sale_in.items:

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="At least one product is required",
                )

            # =================================================
            # GENERATE INVOICE
            # =================================================

            invoice_number = (
                generate_invoice_number(
                    db=db,
                    company_id=company_id,
                )
            )

            # =================================================
            # CREATE SALE
            # =================================================

            sale = Sale(
                companyId=company_id,

                customerId=customer.id,

                customerName=(
                    f"{customer.firstName} "
                    f"{customer.lastName}"
                ),

                invoiceNumber=invoice_number,

                salesChannel=(
                    sale_in.salesChannel
                ),

                paymentMethod=(
                    sale_in.paymentMethod
                ),

                discount=sale_discount,

                tax=sale_tax,

                totalAmount=0,

                status="Completed",

                notes=sale_in.notes,

                createdBy=performed_by,
            )

            db.add(sale)

            db.flush()

            # =================================================
            # TOTALS
            # =================================================

            subtotal_amount = 0.0

            item_discount = 0.0

            item_tax = 0.0

            total_quantity = 0

            # =================================================
            # CREATE SALE ITEMS
            # =================================================

            for item in sale_in.items:

                # =============================================
                # FIND PRODUCT
                # =============================================

                product = (
                    db.query(Product)
                    .filter(
                        Product.id
                        == item.productId,

                        Product.companyId
                        == company_id,
                    )
                    .first()
                )

                if not product:

                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=(
                            f"Product "
                            f"{item.productId} "
                            "not found"
                        ),
                    )

                # =============================================
                # CATEGORY
                # =============================================

                if (
                    item.categoryId
                    != product.categoryId
                ):

                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            f"Category does not match "
                            f"product {product.name}. "
                            f"Expected category "
                            f"{product.categoryId}, "
                            f"received "
                            f"{item.categoryId}."
                        ),
                    )

                # =============================================
                # QUANTITY
                # =============================================

                quantity = int(
                    item.quantity
                )

                if quantity <= 0:

                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            "Quantity must be "
                            "greater than zero"
                        ),
                    )

                # =============================================
                # STOCK
                # =============================================

                stock_quantity = int(
                    product.stockQuantity or 0
                )

                if quantity > stock_quantity:

                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            f"Only "
                            f"{stock_quantity} "
                            f"items available in stock "
                            f"for {product.name}"
                        ),
                    )

                # =============================================
                # DATABASE PRICE
                # =============================================

                actual_unit_price = float(
                    product.unitPrice or 0
                )

                if actual_unit_price < 0:

                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            f"Product {product.name} "
                            "has an invalid price"
                        ),
                    )

                # =============================================
                # ITEM DISCOUNT
                # =============================================

                item_discount_value = float(
                    item.discount or 0
                )

                if item_discount_value < 0:

                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            "Item discount "
                            "cannot be negative"
                        ),
                    )

                # =============================================
                # ITEM TAX
                # =============================================

                item_tax_value = float(
                    item.tax or 0
                )

                if item_tax_value < 0:

                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            "Item tax "
                            "cannot be negative"
                        ),
                    )

                # =============================================
                # LINE SUBTOTAL
                # =============================================

                line_subtotal = (
                    actual_unit_price
                    * quantity
                )

                # =============================================
                # DISCOUNT LIMIT
                # =============================================

                if (
                    item_discount_value
                    > line_subtotal
                ):

                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            f"Discount cannot exceed "
                            f"product value for "
                            f"{product.name}"
                        ),
                    )

                # =============================================
                # LINE TOTAL
                # =============================================

                line_total = (
                    line_subtotal
                    - item_discount_value
                    + item_tax_value
                )

                if line_total < 0:

                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=(
                            f"Line total cannot be "
                            f"negative for "
                            f"{product.name}"
                        ),
                    )

                # =============================================
                # SALE ITEM
                # =============================================

                sale_item = SaleItem(

                    saleId=sale.id,

                    productId=product.id,

                    categoryId=product.categoryId,

                    quantity=quantity,

                    unitPrice=actual_unit_price,

                    discount=item_discount_value,

                    tax=item_tax_value,

                    total=line_total,
                )

                db.add(sale_item)

                # =============================================
                # STOCK
                # =============================================

                previous_stock = (
                    product.stockQuantity
                )

                product.stockQuantity = (
                    stock_quantity
                    - quantity
                )

                new_stock = (
                    product.stockQuantity
                )

                # =============================================
                # STOCK MOVEMENT
                # =============================================

                movement = StockMovement(

                    companyId=company_id,

                    productId=product.id,

                    movementType="SALE",

                    quantity=quantity,

                    previousStock=previous_stock,

                    newStock=new_stock,

                    referenceType="Sale",

                    referenceId=sale.id,

                    unitPrice=actual_unit_price,

                    notes=(
                        f"Stock reduced for "
                        f"invoice "
                        f"{sale.invoiceNumber}"
                    ),
                )

                db.add(movement)

                # =============================================
                # PRODUCT STATUS
                # =============================================

                if product.stockQuantity == 0:

                    product.status = "Out of Stock"

                elif (
                    product.status
                    == "Out of Stock"
                ):

                    product.status = "Active"

                # =============================================
                # TOTALS
                # =============================================

                subtotal_amount += (
                    line_subtotal
                )

                item_discount += (
                    item_discount_value
                )

                item_tax += (
                    item_tax_value
                )

                total_quantity += quantity

            # =================================================
            # FINAL BILL
            # =================================================

            final_discount = (
                item_discount
                + sale_discount
            )

            final_tax = (
                item_tax
                + sale_tax
            )

            grand_total = (
                subtotal_amount
                - final_discount
                + final_tax
            )

            if grand_total < 0:

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Final sale amount "
                        "cannot be negative"
                    ),
                )

            sale.totalAmount = (
                grand_total
            )

            db.flush()

            # =================================================
            # CUSTOMER PURCHASE SUMMARY
            # =================================================

            purchase_summary = (
                db.query(
                    CustomerPurchaseSummary
                )
                .filter(
                    CustomerPurchaseSummary.customerId
                    == customer.id,

                    CustomerPurchaseSummary.companyId
                    == company_id,
                )
                .first()
            )

            # =================================================
            # CREATE SUMMARY
            # =================================================

            if not purchase_summary:

                purchase_summary = (
                    CustomerPurchaseSummary(

                        companyId=company_id,

                        customerId=customer.id,

                        totalOrders=0,

                        totalRevenue=0,

                        totalQuantity=0,

                        averageOrderValue=0,

                        purchaseFrequency=0,

                        firstPurchaseDate=(
                            sale.saleDate
                        ),

                        lastPurchaseDate=(
                            sale.saleDate
                        ),

                        customerSegment="New",
                    )
                )

                db.add(
                    purchase_summary
                )

                db.flush()

            # =================================================
            # UPDATE SUMMARY
            # =================================================

            purchase_summary.totalOrders = (
                (purchase_summary.totalOrders or 0)
                + 1
            )

            purchase_summary.totalRevenue = (
                (purchase_summary.totalRevenue or 0)
                + grand_total
            )

            purchase_summary.totalQuantity = (
                (purchase_summary.totalQuantity or 0)
                + total_quantity
            )

            purchase_summary.averageOrderValue = (
                purchase_summary.totalRevenue
                / purchase_summary.totalOrders
            )

            purchase_summary.purchaseFrequency = (
                purchase_summary.totalOrders
            )

            purchase_summary.lastPurchaseDate = (
                sale.saleDate
            )

            # =================================================
            # CUSTOMER SEGMENT
            # =================================================

            if (
                purchase_summary.totalOrders
                >= 20
            ):

                purchase_summary.customerSegment = "VIP"

            elif (
                purchase_summary.totalOrders
                >= 10
            ):

                purchase_summary.customerSegment = "Loyal"

            elif (
                purchase_summary.totalOrders
                >= 2
            ):

                purchase_summary.customerSegment = "Regular"

            else:

                purchase_summary.customerSegment = "New"

            # =================================================
            # COMMIT
            # =================================================

            db.commit()

            db.refresh(sale)

            # =================================================
            # AUDIT LOG
            # =================================================

            try:

                log_event(
                    db=db,

                    company_id=company_id,

                    target_name=(
                        sale.invoiceNumber
                    ),

                    action="Sale Created",

                    performed_by=performed_by,
                )

            except Exception as audit_error:

                print(
                    "AUDIT LOG ERROR:",
                    repr(audit_error),
                )

            return sale

        except HTTPException:

            db.rollback()

            raise

        except Exception as exc:

            db.rollback()

            print(
                "CREATE SALE ERROR:",
                repr(exc),
            )

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=(
                    "Failed to create sale. "
                    f"Error: {str(exc)}"
                ),
            )

    # =========================================================
    # DELETE SALE
    # =========================================================

    @staticmethod
    def delete_sale(
        db: Session,
        sale_id: int,
        company_id: int,
        performed_by: str,
    ):

        try:

            sale = (
                db.query(Sale)
                .filter(
                    Sale.id == sale_id,
                    Sale.companyId
                    == company_id,
                )
                .first()
            )

            if not sale:

                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Sale not found",
                )

            invoice_number = (
                sale.invoiceNumber
            )

            customer_id = (
                sale.customerId
            )

            sale_total = float(
                sale.totalAmount or 0
            )

            sale_quantity = sum(
                int(item.quantity)
                for item in sale.sale_items
            )

            # =============================================
            # RESTORE STOCK
            # =============================================

            for item in sale.sale_items:

                product = (
                    db.query(Product)
                    .filter(
                        Product.id
                        == item.productId,

                        Product.companyId
                        == company_id,
                    )
                    .first()
                )

                if product:

                    previous_stock = (
                        product.stockQuantity
                    )

                    product.stockQuantity = (
                        int(
                            product.stockQuantity
                            or 0
                        )
                        + int(item.quantity)
                    )

                    new_stock = (
                        product.stockQuantity
                    )

                    movement = StockMovement(

                        companyId=company_id,

                        productId=product.id,

                        movementType="SALE_RETURN",

                        quantity=item.quantity,

                        previousStock=previous_stock,

                        newStock=new_stock,

                        referenceType="Sale Delete",

                        referenceId=sale.id,

                        unitPrice=item.unitPrice,

                        notes=(
                            f"Stock restored after "
                            f"deleting invoice "
                            f"{invoice_number}"
                        ),
                    )

                    db.add(movement)

                    if (
                        product.stockQuantity > 0
                    ):

                        product.status = "Active"

            # =============================================
            # CUSTOMER SUMMARY
            # =============================================

            purchase_summary = (
                db.query(
                    CustomerPurchaseSummary
                )
                .filter(
                    CustomerPurchaseSummary.customerId
                    == customer_id,

                    CustomerPurchaseSummary.companyId
                    == company_id,
                )
                .first()
            )

            if purchase_summary:

                purchase_summary.totalOrders = max(
                    0,
                    (
                        purchase_summary.totalOrders
                        or 0
                    ) - 1,
                )

                purchase_summary.totalRevenue = max(
                    0,
                    (
                        purchase_summary.totalRevenue
                        or 0
                    ) - sale_total,
                )

                purchase_summary.totalQuantity = max(
                    0,
                    (
                        purchase_summary.totalQuantity
                        or 0
                    ) - sale_quantity,
                )

                if (
                    purchase_summary.totalOrders
                    > 0
                ):

                    purchase_summary.averageOrderValue = (
                        purchase_summary.totalRevenue
                        / purchase_summary.totalOrders
                    )

                    purchase_summary.purchaseFrequency = (
                        purchase_summary.totalOrders
                    )

                else:

                    purchase_summary.averageOrderValue = 0

                    purchase_summary.purchaseFrequency = 0

                    purchase_summary.customerSegment = "New"

            # =============================================
            # DELETE
            # =============================================

            db.delete(sale)

            db.commit()

            # =============================================
            # AUDIT
            # =============================================

            try:

                log_event(
                    db=db,

                    company_id=company_id,

                    target_name=invoice_number,

                    action="Sale Deleted",

                    performed_by=performed_by,
                )

            except Exception as audit_error:

                print(
                    "AUDIT LOG ERROR:",
                    repr(audit_error),
                )

            return {
                "message": "Sale deleted successfully",
                "invoiceNumber": invoice_number,
            }

        except HTTPException:

            db.rollback()

            raise

        except Exception as exc:

            db.rollback()

            print(
                "DELETE SALE ERROR:",
                repr(exc),
            )

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete sale",
            )