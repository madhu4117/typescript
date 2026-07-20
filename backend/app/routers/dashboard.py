from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.database import get_db
from app.models.user import User
from app.utils.security import get_current_admin
from app.models.product import Product
from app.models.category import Category

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    company_id = admin.company_id

    total_products = db.query(func.count(Product.id)).filter(Product.companyId == company_id).scalar()
    active_products = db.query(func.count(Product.id)).filter(
        Product.companyId == company_id,
        Product.status == "Active"
    ).scalar()
    inactive_products = db.query(func.count(Product.id)).filter(
        Product.companyId == company_id,
        Product.status == "Inactive"
    ).scalar()
    total_categories = db.query(func.count(Category.id)).filter(Category.companyId == company_id).scalar()

    return {
        "totalProducts": total_products or 0,
        "activeProducts": active_products or 0,
        "inactiveProducts": inactive_products or 0,
        "totalCategories": total_categories or 0
    }
