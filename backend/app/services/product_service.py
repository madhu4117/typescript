from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import List, Optional

from app.models.product import Product
from app.repository.product_repository import ProductRepository
from app.repository.category_repository import CategoryRepository
from app.schemas.product_schema import ProductCreate, ProductUpdate
from app.services.audit_service import log_event


class ProductService:

    @staticmethod
    def get_product(db: Session, product_id: int, company_id: int) -> Product:
        db_product = ProductRepository.get_by_id(db, product_id, company_id)
        if not db_product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        return db_product

    @staticmethod
    def get_all_products(
        db: Session,
        company_id: int,
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        status_filter: Optional[str] = None,
        brand: Optional[str] = None,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = "asc"
    ) -> List[Product]:
        return ProductRepository.get_all(
            db=db,
            company_id=company_id,
            search=search,
            category_id=category_id,
            status=status_filter,
            brand=brand,
            sort_by=sort_by,
            sort_order=sort_order
        )

    @staticmethod
    def create_product(db: Session, product_in: ProductCreate, company_id: int, performed_by: str) -> Product:
        # Validate Category exists and belongs to the company
        category = CategoryRepository.get_by_id(db, product_in.categoryId, company_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid category. Category does not exist or belongs to another company."
            )

        # Validate unique SKU within the company
        sku_clean = product_in.sku.strip()
        if not sku_clean:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SKU is mandatory"
            )
        existing_sku = ProductRepository.get_by_sku(db, sku_clean, company_id)
        if existing_sku:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"SKU '{sku_clean}' already exists in this company."
            )

        # Validate unique product name within the same category
        existing_name = ProductRepository.get_by_name_in_category(db, product_in.name, product_in.categoryId, company_id)
        if existing_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product name '{product_in.name}' already exists in this category."
            )

        # Validate unit price > 0
        if product_in.unitPrice <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unit Price must be greater than zero."
            )

        # Validate cost price <= unit price
        if product_in.costPrice > product_in.unitPrice:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cost Price cannot exceed Unit Price."
            )

        # Validate stock quantity >= 0
        if product_in.stockQuantity < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stock Quantity cannot be negative."
            )

        db_product = ProductRepository.create(db, product_in, company_id)

        # Log event with structured details
        after_data = {
            "name": db_product.name,
            "sku": db_product.sku,
            "unitPrice": db_product.unitPrice,
            "costPrice": db_product.costPrice,
            "stockQuantity": db_product.stockQuantity,
            "status": str(db_product.status.value if hasattr(db_product.status, "value") else db_product.status),
            "categoryId": db_product.categoryId,
        }
        log_event(
            db=db,
            company_id=company_id,
            target_name=db_product.name,
            action="CREATE",
            performed_by=performed_by,
            resource_type="Product",
            resource_id=db_product.id,
            after_data=after_data,
            description=f"Created product '{db_product.name}' (SKU: {db_product.sku})",
        )

        return db_product

    @staticmethod
    def update_product(db: Session, product_id: int, product_in: ProductUpdate, company_id: int, performed_by: str) -> Product:
        db_product = ProductService.get_product(db, product_id, company_id)
        old_status = db_product.status

        # Snapshot before data
        before_data = {
            "name": db_product.name,
            "sku": db_product.sku,
            "unitPrice": db_product.unitPrice,
            "costPrice": db_product.costPrice,
            "stockQuantity": db_product.stockQuantity,
            "status": str(old_status.value if hasattr(old_status, "value") else old_status),
            "categoryId": db_product.categoryId,
        }

        # Validate new category if provided
        if product_in.categoryId is not None and product_in.categoryId != db_product.categoryId:
            category = CategoryRepository.get_by_id(db, product_in.categoryId, company_id)
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid category. Category does not exist or belongs to another company."
                )

        # Validate new SKU if provided
        if product_in.sku is not None:
            sku_clean = product_in.sku.strip()
            if not sku_clean:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="SKU is mandatory"
                )
            if sku_clean != db_product.sku:
                existing_sku = ProductRepository.get_by_sku(db, sku_clean, company_id)
                if existing_sku:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"SKU '{sku_clean}' already exists in this company."
                    )

        # Validate new product name if provided
        target_name = product_in.name if product_in.name is not None else db_product.name
        target_category_id = product_in.categoryId if product_in.categoryId is not None else db_product.categoryId

        if (product_in.name is not None and product_in.name != db_product.name) or \
           (product_in.categoryId is not None and product_in.categoryId != db_product.categoryId):
            existing_name = ProductRepository.get_by_name_in_category(db, target_name, target_category_id, company_id)
            if existing_name and existing_name.id != product_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product name '{target_name}' already exists in this category."
                )

        # Validate prices
        target_unit_price = product_in.unitPrice if product_in.unitPrice is not None else db_product.unitPrice
        target_cost_price = product_in.costPrice if product_in.costPrice is not None else db_product.costPrice

        if target_unit_price <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unit Price must be greater than zero."
            )

        if target_cost_price > target_unit_price:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cost Price cannot exceed Unit Price."
            )

        # Validate stock
        if product_in.stockQuantity is not None and product_in.stockQuantity < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stock Quantity cannot be negative."
            )

        updated_product = ProductRepository.update(db, db_product, product_in)

        # Snapshot after data
        after_data = {
            "name": updated_product.name,
            "sku": updated_product.sku,
            "unitPrice": updated_product.unitPrice,
            "costPrice": updated_product.costPrice,
            "stockQuantity": updated_product.stockQuantity,
            "status": str(updated_product.status.value if hasattr(updated_product.status, "value") else updated_product.status),
            "categoryId": updated_product.categoryId,
        }

        from app.services.audit_service import compute_dict_diff
        diff_before, diff_after = compute_dict_diff(before_data, after_data)

        # Determine action and description
        new_status_str = after_data["status"]
        old_status_str = before_data["status"]

        if product_in.status is not None and product_in.status != old_status:
            action = "PRODUCT_DEACTIVATION" if new_status_str == "Inactive" else "UPDATE"
            desc = f"Product status changed from {old_status_str} to {new_status_str}"
        else:
            action = "UPDATE"
            desc = f"Updated product '{updated_product.name}'"

        log_event(
            db=db,
            company_id=company_id,
            target_name=updated_product.name,
            action=action,
            performed_by=performed_by,
            resource_type="Product",
            resource_id=updated_product.id,
            before_data=diff_before,
            after_data=diff_after,
            description=desc,
        )

        return updated_product

    @staticmethod
    def delete_product(db: Session, product_id: int, company_id: int, performed_by: str) -> None:
        db_product = ProductService.get_product(db, product_id, company_id)
        product_name = db_product.name
        before_data = {
            "name": db_product.name,
            "sku": db_product.sku,
            "unitPrice": db_product.unitPrice,
            "stockQuantity": db_product.stockQuantity,
            "status": str(db_product.status.value if hasattr(db_product.status, "value") else db_product.status),
        }

        ProductRepository.delete(db, db_product)

        # Log event
        log_event(
            db=db,
            company_id=company_id,
            target_name=product_name,
            action="DELETE",
            performed_by=performed_by,
            resource_type="Product",
            resource_id=product_id,
            before_data=before_data,
            description=f"Deleted product '{product_name}'",
        )
