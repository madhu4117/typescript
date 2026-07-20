from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.database import get_db
from app.models.user import User
from app.models.product import Product
from app.utils.security import get_current_admin
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.services.category_service import CategoryService
from typing import List, Optional

router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    performed_by = f"{admin.name} ({admin.email})"
    category = CategoryService.create_category(
        db=db,
        category_in=category_in,
        company_id=admin.company_id,
        performed_by=performed_by
    )

    return CategoryResponse(
        id=category.id,
        companyId=category.companyId,
        name=category.name,
        description=category.description,
        status=category.status,
        product_count=0,
        createdAt=category.createdAt,
        updatedAt=category.updatedAt
    )


@router.get("/", response_model=List[CategoryResponse])
def get_categories(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    results = CategoryService.get_all_categories(
        db=db,
        company_id=admin.company_id,
        search=search
    )

    response_data = []
    for category, product_count in results:
        response_data.append(CategoryResponse(
            id=category.id,
            companyId=category.companyId,
            name=category.name,
            description=category.description,
            status=category.status,
            product_count=product_count,
            createdAt=category.createdAt,
            updatedAt=category.updatedAt
        ))
    return response_data


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category_details(
    category_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    category = CategoryService.get_category(
        db=db,
        category_id=category_id,
        company_id=admin.company_id
    )

    # count products under this category
    product_count = db.query(func.count(Product.id)).filter(
        Product.categoryId == category_id,
        Product.companyId == admin.company_id
    ).scalar()

    return CategoryResponse(
        id=category.id,
        companyId=category.companyId,
        name=category.name,
        description=category.description,
        status=category.status,
        product_count=product_count or 0,
        createdAt=category.createdAt,
        updatedAt=category.updatedAt
    )


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int,
    category_in: CategoryUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    performed_by = f"{admin.name} ({admin.email})"
    category = CategoryService.update_category(
        db=db,
        category_id=category_id,
        category_in=category_in,
        company_id=admin.company_id,
        performed_by=performed_by
    )

    # count products under this category
    product_count = db.query(func.count(Product.id)).filter(
        Product.categoryId == category_id,
        Product.companyId == admin.company_id
    ).scalar()

    return CategoryResponse(
        id=category.id,
        companyId=category.companyId,
        name=category.name,
        description=category.description,
        status=category.status,
        product_count=product_count or 0,
        createdAt=category.createdAt,
        updatedAt=category.updatedAt
    )


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    performed_by = f"{admin.name} ({admin.email})"
    CategoryService.delete_category(
        db=db,
        category_id=category_id,
        company_id=admin.company_id,
        performed_by=performed_by
    )
    return None
