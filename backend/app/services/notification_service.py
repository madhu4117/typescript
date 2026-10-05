from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.user import User
from app.models.product import Product
from app.models.inventory import Inventory


# =========================================================
# ROLE NOTIFICATION MATRIX
# =========================================================
# Admin / Company Admin: All operational, business & system alerts
# Analyst: Analytics, inventory risks, sales alerts, system alerts
# Viewer: Sales and general system alerts only

ROLE_NOTIFICATION_TYPES = {
    "Admin": {
        "Stockout Risk",
        "Low Stock",
        "Overstock",
        "Import Completed",
        "Import Failed",
        "Sales Alert",
        "System Alert",
    },
    "Company Admin": {
        "Stockout Risk",
        "Low Stock",
        "Overstock",
        "Import Completed",
        "Import Failed",
        "Sales Alert",
        "System Alert",
    },
    "Analyst": {
        "Stockout Risk",
        "Low Stock",
        "Overstock",
        "Sales Alert",
        "System Alert",
    },
    "Viewer": {
        "Sales Alert",
        "System Alert",
    },
}


# =========================================================
# NORMALIZE ROLE
# =========================================================

def normalize_role(role) -> str:
    if hasattr(role, "value"):
        role = role.value
    if not role:
        return ""
    return str(role).strip()


# =========================================================
# ROLE CAN RECEIVE
# =========================================================

def role_can_receive(
    user: User,
    notification_type: str,
) -> bool:
    role = normalize_role(getattr(user, "role", None))
    allowed = ROLE_NOTIFICATION_TYPES.get(role, set())
    return notification_type in allowed


# =========================================================
# CREATE NOTIFICATION FOR USER (DEDUPLICATED & ROLE-AWARE)
# =========================================================

def create_notification_for_user(
    db: Session,
    user: User,
    notification_type: str,
    title: str,
    message: str,
    priority: str = "Low",
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
    dedupe_key: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
) -> Optional[Notification]:
    """
    Creates a notification for a specific user after checking:
    1. Role eligibility via ROLE_NOTIFICATION_TYPES matrix.
    2. Company isolation (taken directly from user.company_id).
    3. Duplicate prevention: if dedupe_key is provided and an active (unresolved)
       notification already exists for this user, duplicate creation is skipped.
    """
    company_id = user.company_id

    # 1. Role Eligibility Check
    if not role_can_receive(user, notification_type):
        return None

    # 2. Duplicate Prevention Check
    if dedupe_key:
        existing = (
            db.query(Notification)
            .filter(
                Notification.companyId == company_id,
                Notification.userId == user.id,
                Notification.dedupeKey == dedupe_key,
                Notification.resolvedAt.is_(None),
            )
            .first()
        )
        if existing:
            return existing

    # 3. Create Notification
    notification = Notification(
        companyId=company_id,
        userId=user.id,
        type=notification_type,
        title=title,
        message=message,
        priority=priority,
        resourceType=resource_type,
        resourceId=resource_id,
        isRead=False,
        dedupeKey=dedupe_key,
        details=details,
    )

    db.add(notification)
    db.flush()

    return notification


# =========================================================
# BROADCAST TO COMPANY USERS
# =========================================================

def create_company_notification(
    db: Session,
    company_id: int,
    notification_type: str,
    title: str,
    message: str,
    priority: str = "Low",
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
    dedupe_key: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
) -> List[Notification]:
    """
    Broadcasts a notification to all authorized users within the specified company.
    Strictly prevents cross-company leaking.
    """
    users = (
        db.query(User)
        .filter(User.company_id == company_id)
        .all()
    )

    created = []
    for user in users:
        notification = create_notification_for_user(
            db=db,
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            priority=priority,
            resource_type=resource_type,
            resource_id=resource_id,
            dedupe_key=dedupe_key,
            details=details,
        )
        if notification:
            created.append(notification)

    return created


# =========================================================
# INVENTORY ALERT EVALUATION & LIFECYCLE
# =========================================================

def evaluate_product_inventory(
    db: Session,
    product: Product,
) -> List[Notification]:
    """
    Evaluates inventory conditions for a product:
    1. Critical: stock == 0 -> 'Stockout Risk' (Critical)
    2. High: days_remaining <= 3 -> 'Stockout Risk' (High)
    3. Medium: stock < reorder_point -> 'Low Stock' (Medium)
    4. Low: overstock condition -> 'Overstock' (Low)
    5. Replenished: stock > reorder_point -> resolves existing active stockout/low-stock alerts
    """
    company_id = product.companyId
    current_stock = int(product.stockQuantity or 0)

    # Reorder point: lookup from associated Inventory record or default to 10
    reorder_point = 10
    if product.inventory and product.inventory.reorderLevel is not None:
        reorder_point = int(product.inventory.reorderLevel)
    elif hasattr(product, "reorderPoint") and product.reorderPoint is not None:
        reorder_point = int(product.reorderPoint)

    # Calculate run rate / forecasting metrics if available
    days_remaining = None
    rec_qty = max(0, (reorder_point * 2) - current_stock)
    is_overstock = False

    try:
        from app.services.inventory_forecast_service import InventoryForecastService
        forecast = InventoryForecastService.calculate_product_forecast(
            db=db,
            company_id=company_id,
            product=product,
        )
        if forecast:
            days_remaining = forecast.get("daysOfStockRemaining")
            if forecast.get("recommendedReorderQuantity"):
                rec_qty = forecast.get("recommendedReorderQuantity")
            if forecast.get("stockRisk") == "Overstock":
                is_overstock = True
    except Exception:
        # Fallback if forecast calculation is not available
        pass

    now = datetime.now(timezone.utc)

    # ---------------------------------------------------------
    # CASE 1: CRITICAL - OUT OF STOCK (stock <= 0)
    # ---------------------------------------------------------
    if current_stock <= 0:
        # Resolve any previous Low Stock alerts since it escalated to Out of Stock
        db.query(Notification).filter(
            Notification.companyId == company_id,
            Notification.resourceType == "Product",
            Notification.resourceId == product.id,
            Notification.type == "Low Stock",
            Notification.resolvedAt.is_(None),
        ).update({"resolvedAt": now}, synchronize_session=False)

        details = {
            "productName": product.name,
            "sku": product.sku,
            "currentStock": 0,
            "reorderPoint": reorder_point,
            "risk": "Out of Stock",
            "recommendedQuantity": rec_qty if rec_qty > 0 else 40,
            "daysRemaining": 0,
        }

        return create_company_notification(
            db=db,
            company_id=company_id,
            notification_type="Stockout Risk",
            title="Inventory Alert - Out of Stock",
            message=f"{product.name} (SKU: {product.sku}) has reached 0 stock.",
            priority="Critical",
            resource_type="Product",
            resource_id=product.id,
            dedupe_key=f"inventory:stockout:{company_id}:{product.id}",
            details=details,
        )

    # ---------------------------------------------------------
    # CASE 2: HIGH - STOCKOUT RISK (Expected to stock out in <= 3 days)
    # ---------------------------------------------------------
    if days_remaining is not None and days_remaining <= 3:
        # Resolve any previous critical stockout alert if stock was added but still <= 3 days
        db.query(Notification).filter(
            Notification.companyId == company_id,
            Notification.resourceType == "Product",
            Notification.resourceId == product.id,
            Notification.type == "Stockout Risk",
            Notification.priority == "Critical",
            Notification.resolvedAt.is_(None),
        ).update({"resolvedAt": now}, synchronize_session=False)

        display_days = int(days_remaining) if days_remaining == int(days_remaining) else round(days_remaining, 1)
        details = {
            "productName": product.name,
            "sku": product.sku,
            "currentStock": current_stock,
            "reorderPoint": reorder_point,
            "risk": "Stockout Risk",
            "recommendedQuantity": rec_qty if rec_qty > 0 else 40,
            "daysRemaining": display_days,
        }

        return create_company_notification(
            db=db,
            company_id=company_id,
            notification_type="Stockout Risk",
            title="Inventory Alert - Stockout Risk",
            message=f"{product.name} is expected to reach stockout within {display_days} days.",
            priority="High",
            resource_type="Product",
            resource_id=product.id,
            dedupe_key=f"inventory:stockout_risk:{company_id}:{product.id}",
            details=details,
        )

    # ---------------------------------------------------------
    # CASE 3: MEDIUM - LOW STOCK (Current Stock < Reorder Point)
    # ---------------------------------------------------------
    if current_stock < reorder_point:
        # Resolve previous out of stock alert since stock is now > 0
        db.query(Notification).filter(
            Notification.companyId == company_id,
            Notification.resourceType == "Product",
            Notification.resourceId == product.id,
            Notification.type == "Stockout Risk",
            Notification.resolvedAt.is_(None),
        ).update({"resolvedAt": now}, synchronize_session=False)

        details = {
            "productName": product.name,
            "sku": product.sku,
            "currentStock": current_stock,
            "reorderPoint": reorder_point,
            "risk": "Low Stock",
            "recommendedQuantity": rec_qty if rec_qty > 0 else 30,
            "daysRemaining": days_remaining,
        }

        return create_company_notification(
            db=db,
            company_id=company_id,
            notification_type="Low Stock",
            title="Low Stock Alert",
            message=f"{product.name} has fallen below the reorder point ({current_stock} remaining, reorder point is {reorder_point}).",
            priority="Medium",
            resource_type="Product",
            resource_id=product.id,
            dedupe_key=f"inventory:low:{company_id}:{product.id}",
            details=details,
        )

    # ---------------------------------------------------------
    # CASE 4: LOW - OVERSTOCK
    # ---------------------------------------------------------
    if is_overstock and current_stock > 50:
        details = {
            "productName": product.name,
            "sku": product.sku,
            "currentStock": current_stock,
            "reorderPoint": reorder_point,
            "risk": "Overstock",
            "recommendedQuantity": 0,
        }

        return create_company_notification(
            db=db,
            company_id=company_id,
            notification_type="Overstock",
            title="Overstock Alert",
            message=f"{product.name} exceeds forecasted demand with {current_stock} units in stock.",
            priority="Low",
            resource_type="Product",
            resource_id=product.id,
            dedupe_key=f"inventory:overstock:{company_id}:{product.id}",
            details=details,
        )

    # ---------------------------------------------------------
    # CASE 5: REPLENISHED HEALTHY (stock >= reorder_point)
    # ---------------------------------------------------------
    # Auto-resolve existing stockout and low-stock alerts
    db.query(Notification).filter(
        Notification.companyId == company_id,
        Notification.resourceType == "Product",
        Notification.resourceId == product.id,
        Notification.type.in_(["Stockout Risk", "Low Stock"]),
        Notification.resolvedAt.is_(None),
    ).update({"resolvedAt": now}, synchronize_session=False)

    return []


# =========================================================
# EVALUATE ALL PRODUCTS IN COMPANY
# =========================================================

def evaluate_company_inventory_alerts(
    db: Session,
    company_id: int,
) -> List[Notification]:
    """
    Evaluates inventory status for all products belonging to the company.
    Called on demand or during notification polling.
    """
    products = (
        db.query(Product)
        .filter(Product.companyId == company_id)
        .all()
    )

    created_notifications = []
    for product in products:
        notifications = evaluate_product_inventory(db, product)
        if notifications:
            created_notifications.extend(notifications)

    db.commit()
    return created_notifications