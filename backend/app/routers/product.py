from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.product import Product
from app.models.user import User
from app.schemas.product_schema import (
    ProductCreate,
    ProductResponse,
    ProductUpdate,
)
from app.services.product_service import ProductService
from app.services.audit_service import create_audit_log
from app.utils.security import get_current_admin


router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


# ============================================================
# PRODUCT RESPONSE MAPPER
# ============================================================

def map_product_response(product: Product) -> ProductResponse:
    return ProductResponse(
        id=product.id,
        companyId=product.companyId,
        categoryId=product.categoryId,
        name=product.name,
        sku=product.sku,
        brand=product.brand,
        description=product.description,
        unitPrice=product.unitPrice,
        costPrice=product.costPrice,
        stockQuantity=product.stockQuantity,
        unitOfMeasure=product.unitOfMeasure,
        status=product.status,
        category_name=product.category.name if product.category else None,
        createdAt=product.createdAt,
        updatedAt=product.updatedAt,
    )


# ============================================================
# PRODUCT SNAPSHOT
# Used for Audit Logs before/after data
# ============================================================

def product_snapshot(product: Product) -> dict:
    return {
        "id": product.id,
        "companyId": product.companyId,
        "categoryId": product.categoryId,
        "name": product.name,
        "sku": product.sku,
        "brand": product.brand,
        "description": product.description,
        "unitPrice": product.unitPrice,
        "costPrice": product.costPrice,
        "stockQuantity": product.stockQuantity,
        "unitOfMeasure": product.unitOfMeasure,
        "status": product.status,
    }


# ============================================================
# CREATE PRODUCT
# ============================================================

@router.post(
    "/",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_product(
    product_in: ProductCreate,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    performed_by = f"{admin.name} ({admin.email})"

    # Create product
    product = ProductService.create_product(
        db=db,
        product_in=product_in,
        company_id=admin.company_id,
        performed_by=performed_by,
    )

    # Audit log
    create_audit_log(
        db=db,
        company_id=admin.company_id,
        user_id=admin.id,
        action="CREATE",
        resource_type="Product",
        resource_id=product.id,
        description=f"Created product '{product.name}'",
        request=request,
        after_data=product_snapshot(product),
        status="SUCCESS",
    )

    return map_product_response(product)


# ============================================================
# GET ALL PRODUCTS
# ============================================================

@router.get(
    "/",
    response_model=List[ProductResponse],
)
def get_products(
    search: Optional[str] = None,
    category_id: Optional[int] = Query(None, alias="categoryId"),
    status_filter: Optional[str] = Query(None, alias="status"),
    brand: Optional[str] = None,
    sort_by: Optional[str] = Query(None, alias="sortBy"),
    sort_order: Optional[str] = Query("asc", alias="sortOrder"),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    products = ProductService.get_all_products(
        db=db,
        company_id=admin.company_id,
        search=search,
        category_id=category_id,
        status_filter=status_filter,
        brand=brand,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    return [
        map_product_response(product)
        for product in products
    ]


# ============================================================
# GET SINGLE PRODUCT
# ============================================================

@router.get(
    "/{product_id}",
    response_model=ProductResponse,
)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    product = ProductService.get_product(
        db=db,
        product_id=product_id,
        company_id=admin.company_id,
    )

    return map_product_response(product)


# ============================================================
# UPDATE PRODUCT
# ============================================================

@router.put(
    "/{product_id}",
    response_model=ProductResponse,
)
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    performed_by = f"{admin.name} ({admin.email})"

    # Get existing product BEFORE update
    existing_product = ProductService.get_product(
        db=db,
        product_id=product_id,
        company_id=admin.company_id,
    )

    # Snapshot before update
    before_data = product_snapshot(existing_product)

    # Update product
    product = ProductService.update_product(
        db=db,
        product_id=product_id,
        product_in=product_in,
        company_id=admin.company_id,
        performed_by=performed_by,
    )

    # Snapshot after update
    after_data = product_snapshot(product)

    # Audit log
    create_audit_log(
        db=db,
        company_id=admin.company_id,
        user_id=admin.id,
        action="UPDATE",
        resource_type="Product",
        resource_id=product.id,
        description=f"Updated product '{product.name}'",
        request=request,
        before_data=before_data,
        after_data=after_data,
        status="SUCCESS",
    )

    return map_product_response(product)


# ============================================================
# CHANGE PRODUCT STATUS
# ============================================================

@router.put(
    "/{product_id}/status",
    response_model=ProductResponse,
)
def change_status(
    product_id: int,
    status_in: str = Query(
        ...,
        description="Active or Inactive",
    ),
    request: Request = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    # Validate status
    if status_in not in ["Active", "Inactive"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be Active or Inactive",
        )

    performed_by = f"{admin.name} ({admin.email})"

    # Get existing product BEFORE status change
    existing_product = ProductService.get_product(
        db=db,
        product_id=product_id,
        company_id=admin.company_id,
    )

    old_status = existing_product.status

    # Update status
    product = ProductService.update_product(
        db=db,
        product_id=product_id,
        product_in=ProductUpdate(status=status_in),
        company_id=admin.company_id,
        performed_by=performed_by,
    )

    # Audit log
    create_audit_log(
        db=db,
        company_id=admin.company_id,
        user_id=admin.id,
        action="PRODUCT_STATUS_CHANGE",
        resource_type="Product",
        resource_id=product.id,
        description=(
            f"Changed product '{product.name}' status "
            f"from '{old_status}' to '{product.status}'"
        ),
        request=request,
        before_data={
            "status": old_status,
        },
        after_data={
            "status": product.status,
        },
        status="SUCCESS",
    )

    return map_product_response(product)


# ============================================================
# DELETE PRODUCT
# ============================================================

@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_product(
    product_id: int,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    performed_by = f"{admin.name} ({admin.email})"

    # Get product BEFORE deleting
    existing_product = ProductService.get_product(
        db=db,
        product_id=product_id,
        company_id=admin.company_id,
    )

    # Save product information for audit
    before_data = product_snapshot(existing_product)

    product_name = existing_product.name

    # Delete product
    ProductService.delete_product(
        db=db,
        product_id=product_id,
        company_id=admin.company_id,
        performed_by=performed_by,
    )

    # Audit log
    create_audit_log(
        db=db,
        company_id=admin.company_id,
        user_id=admin.id,
        action="DELETE",
        resource_type="Product",
        resource_id=product_id,
        description=f"Deleted product '{product_name}'",
        request=request,
        before_data=before_data,
        status="SUCCESS",
    )

    return None