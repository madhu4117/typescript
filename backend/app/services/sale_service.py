from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.schemas.sale_schema import SaleCreate
from app.utils.invoice import generate_invoice_number
from app.services.audit_service import log_event


class SaleService:

    @staticmethod
    def create_sale(
        db: Session,
        sale_in: SaleCreate,
        company_id: int,
        performed_by: str,
    ):

        invoice_number = generate_invoice_number(
            db=db,
            company_id=company_id
        )

        total_amount = 0

        sale = Sale(
            companyId=company_id,
            invoiceNumber=invoice_number,
            customerName=sale_in.customerName,
            salesChannel=sale_in.salesChannel,
            paymentMethod=sale_in.paymentMethod,
            totalAmount=0,
            createdBy=performed_by,
        )

        db.add(sale)
        db.flush()

        for item in sale_in.items:

            product = (
                db.query(Product)
                .filter(
                    Product.id == item.productId,
                    Product.companyId == company_id
                )
                .first()
            )

            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product {item.productId} not found"
                )

            if item.quantity <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Quantity must be greater than zero"
                )

            if item.quantity > product.stockQuantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Only {product.stockQuantity} items available in stock"
                )

            if item.discount > (item.unitPrice * item.quantity):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Discount cannot exceed product value"
                )

            subtotal = item.unitPrice * item.quantity
            total = subtotal - item.discount + item.tax

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

            # Update inventory
            product.stockQuantity -= item.quantity

            if product.stockQuantity == 0:
                product.status = "Out of Stock"

            total_amount += total

        sale.totalAmount = total_amount

        db.commit()
        db.refresh(sale)

        log_event(
            db=db,
            company_id=company_id,
            target_name=sale.invoiceNumber,
            action="Sale Created",
            performed_by=performed_by,
        )

        return sale