from datetime import datetime

from sqlalchemy.orm import Session

from app.repository.sale_repository import SaleRepository


def generate_invoice_number(
    db: Session,
    company_id: int
) -> str:

    current_year = datetime.now().year

    last_sale = SaleRepository.get_last_invoice(
        db=db,
        company_id=company_id
    )

    if last_sale is None:
        number = 1
    else:
        try:
            number = int(last_sale.invoiceNumber.split("-")[-1]) + 1
        except Exception:
            number = 1

    return f"INV-{current_year}-{number:06d}"