from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repository.category_repository import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.services.audit_service import log_event
from typing import List, Tuple, Optional
from app.models.category import Category


class CategoryService:

    @staticmethod
    def get_category(db: Session, category_id: int, company_id: int) -> Category:
        db_category = CategoryRepository.get_by_id(db, category_id, company_id)
        if not db_category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        return db_category

    @staticmethod
    def get_all_categories(db: Session, company_id: int, search: Optional[str] = None) -> List[Tuple[Category, int]]:
        return CategoryRepository.get_all(db, company_id, search)

    @staticmethod
    def create_category(db: Session, category_in: CategoryCreate, company_id: int, performed_by: str) -> Category:
        # Check if category name already exists in this company
        existing = CategoryRepository.get_by_name(db, category_in.name, company_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category with name '{category_in.name}' already exists"
            )

        db_category = CategoryRepository.create(db, category_in, company_id)
        # Log event
        log_event(
            db=db,
            company_id=company_id,
            target_name=db_category.name,
            action="CREATE",
            performed_by=performed_by,
            resource_type="Category",
            resource_id=db_category.id,
            after_data={"name": db_category.name, "description": db_category.description},
            description=f"Created category '{db_category.name}'",
        )
        return db_category

    @staticmethod
    def update_category(db: Session, category_id: int, category_in: CategoryUpdate, company_id: int, performed_by: str) -> Category:
        db_category = CategoryService.get_category(db, category_id, company_id)
        before_data = {"name": db_category.name, "description": db_category.description}

        # Check if name is being changed and if new name is already taken
        if category_in.name and category_in.name != db_category.name:
            existing = CategoryRepository.get_by_name(db, category_in.name, company_id)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Category with name '{category_in.name}' already exists"
                )

        updated_category = CategoryRepository.update(db, db_category, category_in)
        after_data = {"name": updated_category.name, "description": updated_category.description}

        from app.services.audit_service import compute_dict_diff
        diff_before, diff_after = compute_dict_diff(before_data, after_data)

        # Log event
        log_event(
            db=db,
            company_id=company_id,
            target_name=updated_category.name,
            action="UPDATE",
            performed_by=performed_by,
            resource_type="Category",
            resource_id=updated_category.id,
            before_data=diff_before,
            after_data=diff_after,
            description=f"Updated category '{updated_category.name}'",
        )
        return updated_category

    @staticmethod
    def delete_category(db: Session, category_id: int, company_id: int, performed_by: str) -> None:
        db_category = CategoryService.get_category(db, category_id, company_id)

        # Check if category has products associated with it
        # We fetch the category tuple (Category, product_count) to find product count
        all_categories = CategoryRepository.get_all(db, company_id)
        prod_count = 0
        for cat, count in all_categories:
            if cat.id == category_id:
                prod_count = count
                break

        if prod_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete category. There are {prod_count} products under this category."
            )

        category_name = db_category.name
        before_data = {"name": db_category.name, "description": db_category.description}
        CategoryRepository.delete(db, db_category)
        # Log event
        log_event(
            db=db,
            company_id=company_id,
            target_name=category_name,
            action="DELETE",
            performed_by=performed_by,
            resource_type="Category",
            resource_id=category_id,
            before_data=before_data,
            description=f"Deleted category '{category_name}'",
        )
