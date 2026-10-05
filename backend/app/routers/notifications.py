from datetime import datetime, timezone
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.notification import Notification
from app.models.user import User

from app.schemas.notification_schema import (
    NotificationResponse,
    NotificationPaginationResponse,
    NotificationUnreadCountResponse,
    NotificationReadResponse,
    NotificationReadAllResponse,
)

from app.utils.security import get_current_user
from app.services.notification_service import evaluate_company_inventory_alerts
from app.services.audit_service import create_audit_log


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


# =========================================================
# GET NOTIFICATIONS (COMPANY & USER ISOLATED)
# =========================================================

@router.get(
    "",
    response_model=NotificationPaginationResponse,
)
@router.get(
    "/",
    response_model=NotificationPaginationResponse,
)
def get_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    unread: Optional[bool] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    notification_type: Optional[str] = Query(None, alias="type"),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    auto_evaluate: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves paginated notifications for the authenticated user within their company.
    Supports filtering by read/unread, notification type, priority, and text search.
    """
    # -----------------------------------------------------
    # AUTOMATIC ALERT EVALUATION (Deduplicated)
    # -----------------------------------------------------
    if auto_evaluate:
        try:
            evaluate_company_inventory_alerts(db, current_user.company_id)
        except Exception as e:
            # Alert evaluation should not break notification retrieval
            pass

    # -----------------------------------------------------
    # BASE QUERY - STRICT ISOLATION
    # -----------------------------------------------------
    query = (
        db.query(Notification)
        .filter(
            # USER ISOLATION
            Notification.userId == current_user.id,
            # COMPANY ISOLATION
            Notification.companyId == current_user.company_id,
            # NOT EXPIRED
            (
                Notification.expiresAt.is_(None)
                | (Notification.expiresAt > datetime.now(timezone.utc))
            ),
        )
    )

    # -----------------------------------------------------
    # READ/UNREAD FILTER
    # -----------------------------------------------------
    if unread is True or status_filter == "unread":
        query = query.filter(Notification.isRead.is_(False))
    elif unread is False or status_filter == "read":
        query = query.filter(Notification.isRead.is_(True))

    # -----------------------------------------------------
    # TYPE FILTER
    # -----------------------------------------------------
    if notification_type and notification_type.upper() != "ALL":
        query = query.filter(Notification.type == notification_type)

    # -----------------------------------------------------
    # PRIORITY FILTER
    # -----------------------------------------------------
    if priority and priority.upper() != "ALL":
        query = query.filter(Notification.priority == priority)

    # -----------------------------------------------------
    # SEARCH FILTER
    # -----------------------------------------------------
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Notification.title.ilike(term),
                Notification.message.ilike(term),
                Notification.type.ilike(term),
            )
        )

    # -----------------------------------------------------
    # UNREAD COUNT
    # -----------------------------------------------------
    unread_count = (
        db.query(Notification)
        .filter(
            Notification.userId == current_user.id,
            Notification.companyId == current_user.company_id,
            Notification.isRead.is_(False),
            (
                Notification.expiresAt.is_(None)
                | (Notification.expiresAt > datetime.now(timezone.utc))
            ),
        )
        .count()
    )

    # -----------------------------------------------------
    # TOTAL & ORDERING
    # -----------------------------------------------------
    total = query.count()
    query = query.order_by(Notification.createdAt.desc())

    # -----------------------------------------------------
    # PAGINATION
    # -----------------------------------------------------
    offset = (page - 1) * limit
    items = query.offset(offset).limit(limit).all()
    total_pages = (total + limit - 1) // limit if total else 0

    return NotificationPaginationResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        totalPages=total_pages,
        unreadCount=unread_count,
    )


# =========================================================
# UNREAD COUNT
# =========================================================

@router.get(
    "/unread-count",
    response_model=NotificationUnreadCountResponse,
)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns total unread notification count for the authenticated user.
    """
    count = (
        db.query(Notification)
        .filter(
            Notification.userId == current_user.id,
            Notification.companyId == current_user.company_id,
            Notification.isRead.is_(False),
            (
                Notification.expiresAt.is_(None)
                | (Notification.expiresAt > datetime.now(timezone.utc))
            ),
        )
        .count()
    )

    return NotificationUnreadCountResponse(unreadCount=count)


# =========================================================
# TRIGGER MANUAL / ON-DEMAND ALERT EVALUATION
# =========================================================

@router.post("/evaluate")
def trigger_alert_evaluation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Forces inventory alert evaluation for the user's company.
    """
    new_alerts = evaluate_company_inventory_alerts(db, current_user.company_id)
    return {
        "message": "Alert evaluation completed",
        "newAlertsCount": len(new_alerts),
    }


# =========================================================
# MARK SINGLE NOTIFICATION AS READ (WITH OWNERSHIP CHECK)
# =========================================================

@router.patch(
    "/{notification_id}/read",
    response_model=NotificationReadResponse,
)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Marks a single notification as read.
    Enforces strict ownership: returns 403 Forbidden if the notification
    belongs to another user or another company.
    """
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id)
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    # Strict company & user ownership authorization
    if (
        notification.companyId != current_user.company_id
        or notification.userId != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to modify this notification",
        )

    if not notification.isRead:
        notification.isRead = True
        notification.readAt = datetime.now(timezone.utc)
        db.commit()
        db.refresh(notification)

    return NotificationReadResponse(
        message="Notification marked as read",
        notification=notification,
    )


# =========================================================
# MARK ALL NOTIFICATIONS AS READ
# =========================================================

@router.patch(
    "/read-all",
    response_model=NotificationReadAllResponse,
)
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Marks all unread notifications for the authenticated user as read.
    Creates an audit log entry for the action.
    """
    notifications = (
        db.query(Notification)
        .filter(
            Notification.userId == current_user.id,
            Notification.companyId == current_user.company_id,
            Notification.isRead.is_(False),
        )
        .all()
    )

    now = datetime.now(timezone.utc)
    for notification in notifications:
        notification.isRead = True
        notification.readAt = now

    updated_count = len(notifications)
    if updated_count > 0:
        db.commit()

        # Audit log entry for mark all read
        try:
            create_audit_log(
                db=db,
                company_id=current_user.company_id,
                user_id=current_user.id,
                user_name=current_user.name,
                user_email=current_user.email,
                action="NOTIFICATION_MARK_ALL_READ",
                resource_type="Notification",
                description=f"Marked {updated_count} notifications as read",
                status="SUCCESS",
            )
        except Exception:
            pass

    return NotificationReadAllResponse(
        message="All notifications marked as read",
        updatedCount=updated_count,
    )


# =========================================================
# GET SINGLE NOTIFICATION DETAILS (WITH SECURITY CHECK)
# =========================================================

@router.get(
    "/{notification_id}",
    response_model=NotificationResponse,
)
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieves full details for a single notification.
    Enforces strict ownership: returns 403 Forbidden if belonging to another user.
    """
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id)
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    # Ownership check
    if (
        notification.companyId != current_user.company_id
        or notification.userId != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not have permission to view this notification",
        )

    return notification