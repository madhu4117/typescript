from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.inventory import Inventory
from app.models.inventory_movement import InventoryMovement
from app.models.product import Product

from app.schemas.inventory_schema import InventoryCreate


class InventoryService:

    @staticmethod
    def calculate_status(available_stock: int, reorder_level: int):

        if available_stock == 0:
            return "Out of Stock"

        if available_stock <= reorder_level:
            return "Low Stock"

        return "In Stock"

    @staticmethod
    def create_inventory(
        db: Session,
        company_id: int,
        data: InventoryCreate,
    ):

        available = data.currentStock - data.reservedStock

        status = InventoryService.calculate_status(
            available,
            data.reorderLevel,
        )

        inventory = Inventory(
            companyId=company_id,
            productId=data.productId,
            currentStock=data.currentStock,
            reservedStock=data.reservedStock,
            availableStock=available,
            reorderLevel=data.reorderLevel,
            stockStatus=status,
        )

        db.add(inventory)
        db.commit()
        db.refresh(inventory)

        return inventory

    @staticmethod
    def get_all_inventory(
        db: Session,
        company_id: int,
        search: str = None,
        category: int = None,
        brand: str = None,
        stock_status: str = None,
    ):

        query = (
    db.query(Inventory, Product)
    .join(
        Product,
        Inventory.productId == Product.id,
    )
    .join(Product.category)
    .filter(
        Inventory.companyId == company_id
    )
)

        if search:
            query = query.filter(
                or_(
                    Product.name.ilike(f"%{search}%"),
                    Product.sku.ilike(f"%{search}%"),
                )
            )

        if category:
            query = query.filter(
                Product.categoryId == category
            )

        if brand:
            query = query.filter(
                Product.brand == brand
            )

        if stock_status:
            query = query.filter(
                Inventory.stockStatus == stock_status
            )

        result = []

        for inventory, product in query.all():

            result.append(
                {
                    "id": inventory.id,
                    "companyId": inventory.companyId,
                    "productId": inventory.productId,

                    "productName": product.name,
                    "sku": product.sku,
                    "category": (product.category.name if product.category else ""),
                    "brand": product.brand,

                    "currentStock": inventory.currentStock,
                    "reservedStock": inventory.reservedStock,
                    "availableStock": inventory.availableStock,
                    "reorderLevel": inventory.reorderLevel,
                    "stockStatus": inventory.stockStatus,
                    "updatedAt": inventory.updatedAt,
                }
            )

        return result

    @staticmethod
    def add_stock(
        db: Session,
        inventory: Inventory,
        quantity: int,
        reason: str,
        remarks: str,
        user_id: int,
    ):

        previous = inventory.currentStock

        inventory.currentStock += quantity

        inventory.availableStock = (
            inventory.currentStock
            - inventory.reservedStock
        )

        inventory.stockStatus = InventoryService.calculate_status(
            inventory.availableStock,
            inventory.reorderLevel,
        )

        movement = InventoryMovement(
            inventoryId=inventory.id,
            movementType="Stock Addition",
            quantityChanged=quantity,
            previousQuantity=previous,
            updatedQuantity=inventory.currentStock,
            reason=reason,
            remarks=remarks,
            performedBy=user_id,
        )

        db.add(movement)
        db.commit()
        db.refresh(inventory)

        return inventory

    @staticmethod
    def remove_stock(
        db: Session,
        inventory: Inventory,
        quantity: int,
        reason: str,
        remarks: str,
        user_id: int,
    ):

        if quantity > inventory.availableStock:
            raise Exception("Insufficient stock.")

        previous = inventory.currentStock

        inventory.currentStock -= quantity

        inventory.availableStock = (
            inventory.currentStock
            - inventory.reservedStock
        )

        inventory.stockStatus = InventoryService.calculate_status(
            inventory.availableStock,
            inventory.reorderLevel,
        )

        movement = InventoryMovement(
            inventoryId=inventory.id,
            movementType="Stock Removal",
            quantityChanged=quantity,
            previousQuantity=previous,
            updatedQuantity=inventory.currentStock,
            reason=reason,
            remarks=remarks,
            performedBy=user_id,
        )

        db.add(movement)
        db.commit()
        db.refresh(inventory)

        return inventory

    @staticmethod
    def manual_adjustment(
        db: Session,
        inventory: Inventory,
        quantity: int,
        reason: str,
        remarks: str,
        user_id: int,
    ):

        previous = inventory.currentStock

        inventory.currentStock = quantity

        inventory.availableStock = (
            inventory.currentStock
            - inventory.reservedStock
        )

        inventory.stockStatus = InventoryService.calculate_status(
            inventory.availableStock,
            inventory.reorderLevel,
        )

        movement = InventoryMovement(
            inventoryId=inventory.id,
            movementType="Manual Adjustment",
            quantityChanged = quantity - previous,
            previousQuantity=previous,
            updatedQuantity=inventory.currentStock,
            reason=reason,
            remarks=remarks,
            performedBy=user_id,
        )

        db.add(movement)
        db.commit()
        db.refresh(inventory)

        return inventory

    @staticmethod
    def movement_history(
        db: Session,
        inventory_id: int,
    ):

        return (
            db.query(InventoryMovement)
            .filter(
                InventoryMovement.inventoryId == inventory_id
            )
            .order_by(
                InventoryMovement.createdAt.desc()
            )
            .all()
        )

    @staticmethod
    def dashboard_summary(
        db: Session,
        company_id: int,
    ):

        inventory = (
            db.query(Inventory)
            .filter(
                Inventory.companyId == company_id
            )
            .all()
        )

        total_products = len(inventory)

        total_inventory = sum(
            i.currentStock
            for i in inventory
        )

        low_stock = len(
            [
                i
                for i in inventory
                if i.stockStatus == "Low Stock"
            ]
        )

        out_stock = len(
            [
                i
                for i in inventory
                if i.stockStatus == "Out of Stock"
            ]
        )

        return {
            "totalProducts": total_products,
            "totalInventory": total_inventory,
            "lowStockProducts": low_stock,
            "outOfStockProducts": out_stock,
        }