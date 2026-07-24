from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.services.inventory_service import InventoryService

from app.schemas.inventory_schema import (
    InventoryCreate,
    StockAdjustmentRequest,
)

from app.models.inventory import Inventory

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"]
)


@router.get("/")
def get_inventory(
    search: str | None = None,
    category: int | None = None,
    brand: str | None = None,
    stock_status: str | None = None,
    db: Session = Depends(get_db),
):

    company_id = 1

    return InventoryService.get_all_inventory(
        db=db,
        company_id=company_id,
        search=search,
        category=category,
        brand=brand,
        stock_status=stock_status,
    )


@router.post("/")
def create_inventory(
    request: InventoryCreate,
    db: Session = Depends(get_db),
):

    company_id = 1

    return InventoryService.create_inventory(
        db,
        company_id,
        request,
    )


@router.put("/{inventory_id}/add-stock")
def add_stock(
    inventory_id: int,
    request: StockAdjustmentRequest,
    db: Session = Depends(get_db),
):

    inventory = (
        db.query(Inventory)
        .filter(Inventory.id == inventory_id)
        .first()
    )

    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory not found"
        )

    return InventoryService.add_stock(
        db=db,
        inventory=inventory,
        quantity=request.quantity,
        reason=request.reason,
        remarks=request.remarks,
        user_id=1,
    )


@router.put("/{inventory_id}/remove-stock")
def remove_stock(
    inventory_id: int,
    request: StockAdjustmentRequest,
    db: Session = Depends(get_db),
):

    inventory = (
        db.query(Inventory)
        .filter(Inventory.id == inventory_id)
        .first()
    )

    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory not found"
        )

    return InventoryService.remove_stock(
        db=db,
        inventory=inventory,
        quantity=request.quantity,
        reason=request.reason,
        remarks=request.remarks,
        user_id=1,
    )


@router.put("/{inventory_id}/adjust")
def manual_adjustment(
    inventory_id: int,
    request: StockAdjustmentRequest,
    db: Session = Depends(get_db),
):

    inventory = (
        db.query(Inventory)
        .filter(Inventory.id == inventory_id)
        .first()
    )

    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory not found"
        )

    return InventoryService.manual_adjustment(
        db=db,
        inventory=inventory,
        quantity=request.quantity,
        reason=request.reason,
        remarks=request.remarks,
        user_id=1,
    )


@router.get("/{inventory_id}/history")
def inventory_history(
    inventory_id: int,
    db: Session = Depends(get_db),
):

    return InventoryService.movement_history(
        db,
        inventory_id,
    )


@router.get("/dashboard/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
):

    company_id = 1

    return InventoryService.dashboard_summary(
        db,
        company_id,
    )