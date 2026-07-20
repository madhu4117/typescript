from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.category import Category
from app.models.product import Product
from app.schemas.category import CategoryCreate, CategoryUpdate
from typing import List, Tuple, Optional


class CategoryRepository:

    @staticmethod
    def get_by_id(db: Session, category_id: int, company_id: int) -> Optional[Category]:
        return db.query(Category).filter(
            Category.id == category_id,
            Category.companyId == company_id
        ).first()

    @staticmethod
    def get_by_name(db: Session, name: str, company_id: int) -> Optional[Category]:
        return db.query(Category).filter(
            Category.name == name,
            Category.companyId == company_id
        ).first()

    @staticmethod
    def get_all(db: Session, company_id: int, search: Optional[str] = None) -> List[Tuple[Category, int]]:
        query = (
            db.query(Category, func.count(Product.id).label("product_count"))
            .outerjoin(Product, Product.categoryId == Category.id)
            .filter(Category.companyId == company_id)
            .group_by(Category.id)
        )

        if search:
            query = query.filter(Category.name.ilike(f"%{search}%"))

        return query.all()

    @staticmethod
    def create(db: Session, category_in: CategoryCreate, company_id: int) -> Category:
        db_category = Category(
            companyId=company_id,
            name=category_in.name,
            description=category_in.description,
            status=category_in.status,
        )
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        return db_category

    @staticmethod
    def update(db: Session, db_category: Category, category_in: CategoryUpdate) -> Category:
        update_data = category_in.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(db_category, key, value)

        db.commit()
        db.refresh(db_category)
        return db_category

    @staticmethod
    def delete(db: Session, db_category: Category) -> None:
        db.delete(db_category)
        db.commit()