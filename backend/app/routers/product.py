from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import User
from app.utils.security import get_current_admin
from app.schemas.product_schema import ProductCreate, ProductUpdate, ProductResponse
from app.services.product_service import ProductService
from app.models.product import Product
from typing import List, Optional

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


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
        updatedAt=product.updatedAt
    )


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    performed_by = f"{admin.name} ({admin.email})"
    product = ProductService.create_product(
        db=db,
        product_in=product_in,
        company_id=admin.company_id,
        performed_by=performed_by
    )
    return map_product_response(product)


@router.get("/", response_model=List[ProductResponse])
def get_products(
    search: Optional[str] = None,
    category_id: Optional[int] = Query(None, alias="categoryId"),
    status: Optional[str] = None,
    brand: Optional[str] = None,
    sort_by: Optional[str] = Query(None, alias="sortBy"),
    sort_order: Optional[str] = Query("asc", alias="sortOrder"),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    # If the request comes from transactional views (e.g. Sales screen),
    # they might want only active products. The status filter handles this.
    products = ProductService.get_all_products(
        db=db,
        company_id=admin.company_id,
        search=search,
        category_id=category_id,
        status_filter=status,
        brand=brand,
        sort_by=sort_by,
        sort_order=sort_order
    )

    return [map_product_response(p) for p in products]


@router.get("/{product_id}", response_model=ProductResponse)
def get_product_details(
    product_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    product = ProductService.get_product(
        db=db,
        product_id=product_id,
        company_id=admin.company_id
    )
    return map_product_response(product)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    performed_by = f"{admin.name} ({admin.email})"
    product = ProductService.update_product(
        db=db,
        product_id=product_id,
        product_in=product_in,
        company_id=admin.company_id,
        performed_by=performed_by
    )
    return map_product_response(product)


@router.put("/{product_id}/status", response_model=ProductResponse)
def toggle_product_status(
    product_id: int,
    status_in: str = Query(..., description="Active or Inactive"),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    if status_in not in ["Active", "Inactive"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be either 'Active' or 'Inactive'"
        )

    performed_by = f"{admin.name} ({admin.email})"
    product_update = ProductUpdate(status=status_in)
    product = ProductService.update_product(
        db=db,
        product_id=product_id,
        product_in=product_update,
        company_id=admin.company_id,
        performed_by=performed_by
    )
    return map_product_response(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    performed_by = f"{admin.name} ({admin.email})"
    ProductService.delete_product(
        db=db,
        product_id=product_id,
        company_id=admin.company_id,
        performed_by=performed_by
    )
    return None
