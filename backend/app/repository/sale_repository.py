from typing import List, Optional

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.models.sale import Sale
from app.models.sale_item import SaleItem


class SaleRepository:

    @staticmethod
    def get_by_id(
        db: Session,
        sale_id: int,
        company_id: int
    ) -> Optional[Sale]:

        return (
            db.query(Sale)
            .options(joinedload(Sale.sale_items))
            .filter(
                Sale.id == sale_id,
                Sale.companyId == company_id
            )
            .first()
        )

    @staticmethod
    def get_all(
        db: Session,
        company_id: int
    ) -> List[Sale]:

        return (
            db.query(Sale)
            .options(joinedload(Sale.sale_items))
            .filter(Sale.companyId == company_id)
            .order_by(Sale.saleDate.desc())
            .all()
        )

    @staticmethod
    def get_last_invoice(
        db: Session,
        company_id: int
    ) -> Optional[Sale]:

        return (
            db.query(Sale)
            .filter(Sale.companyId == company_id)
            .order_by(Sale.id.desc())
            .first()
        )

    @staticmethod
    def create(
        db: Session,
        sale: Sale
    ) -> Sale:

        db.add(sale)
        db.commit()
        db.refresh(sale)

        return sale

    @staticmethod
    def update(
        db: Session,
        sale: Sale
    ) -> Sale:

        db.commit()
        db.refresh(sale)

        return sale

    @staticmethod
    def delete(
        db: Session,
        sale: Sale
    ):

        db.delete(sale)
        db.commit()