from typing import List, Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.models.product import Product
from app.schemas.product_schema import ProductCreate, ProductUpdate


class ProductRepository:

    @staticmethod
    def get_by_id(
        db: Session,
        product_id: int,
        company_id: int
    ) -> Optional[Product]:
        return (
            db.query(Product)
            .options(joinedload(Product.category))
            .filter(
                Product.id == product_id,
                Product.companyId == company_id
            )
            .first()
        )

    @staticmethod
    def get_by_sku(
        db: Session,
        sku: str,
        company_id: int
    ) -> Optional[Product]:
        return (
            db.query(Product)
            .filter(
                Product.sku == sku,
                Product.companyId == company_id
            )
            .first()
        )

    @staticmethod
    def get_by_name_in_category(
        db: Session,
        name: str,
        category_id: int,
        company_id: int
    ) -> Optional[Product]:
        return (
            db.query(Product)
            .filter(
                Product.name == name,
                Product.categoryId == category_id,
                Product.companyId == company_id
            )
            .first()
        )

    @staticmethod
    def get_all(
        db: Session,
        company_id: int,
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        status: Optional[str] = None,
        brand: Optional[str] = None,
        sort_by: Optional[str] = "name",
        sort_order: Optional[str] = "asc",
    ) -> List[Product]:

        query = (
            db.query(Product)
            .options(joinedload(Product.category))
            .filter(Product.companyId == company_id)
        )

        if category_id:
            query = query.filter(Product.categoryId == category_id)

        if status:
            query = query.filter(Product.status == status)

        if brand:
            query = query.filter(Product.brand == brand)

        if search:
            keyword = f"%{search}%"

            query = query.filter(
                or_(
                    Product.name.ilike(keyword),
                    Product.sku.ilike(keyword),
                    Product.brand.ilike(keyword),
                )
            )

        if sort_by == "price":
            if sort_order == "desc":
                query = query.order_by(Product.unitPrice.desc())
            else:
                query = query.order_by(Product.unitPrice.asc())

        elif sort_by == "recently_added":
            if sort_order == "asc":
                query = query.order_by(Product.createdAt.asc())
            else:
                query = query.order_by(Product.createdAt.desc())

        else:
            if sort_order == "desc":
                query = query.order_by(Product.name.desc())
            else:
                query = query.order_by(Product.name.asc())

        return query.all()

    @staticmethod
    def create(
        db: Session,
        product_in: ProductCreate,
        company_id: int
    ) -> Product:

        db_product = Product(
            companyId=company_id,
            categoryId=product_in.categoryId,
            name=product_in.name.strip(),
            sku=product_in.sku.strip(),
            brand=product_in.brand,
            description=product_in.description,
            unitPrice=product_in.unitPrice,
            costPrice=product_in.costPrice,
            stockQuantity=product_in.stockQuantity,
            unitOfMeasure=product_in.unitOfMeasure,
            status=product_in.status,
        )

        db.add(db_product)
        db.commit()
        db.refresh(db_product)

        return db_product

    @staticmethod
    def update(
        db: Session,
        db_product: Product,
        product_in: ProductUpdate
    ) -> Product:

        update_data = product_in.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            if key == "sku" and value:
                value = value.strip()

            if key == "name" and value:
                value = value.strip()

            setattr(db_product, key, value)

        db.commit()
        db.refresh(db_product)

        return db_product

    @staticmethod
    def delete(
        db: Session,
        db_product: Product
    ) -> None:

        db.delete(db_product)
        db.commit()