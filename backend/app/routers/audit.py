from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit_log_schema import (
    AuditLogResponse,
    AuditLogPaginationResponse,
    AuditLogFilterOptionsResponse,
)
from app.utils.security import get_current_admin


router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"],
)


# ============================================================
# GET AUDIT LOGS
# ============================================================

@router.get(
    "/",
    response_model=AuditLogPaginationResponse,
)
def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),

    search: Optional[str] = Query(None),

    userId: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    resourceType: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),

    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None),

    sortOrder: str = Query("desc"),

    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    # --------------------------------------------------------
    # COMPANY ISOLATION
    # --------------------------------------------------------

    query = db.query(AuditLog).filter(
        AuditLog.companyId == admin.company_id
    )

    # --------------------------------------------------------
    # USER FILTER
    # --------------------------------------------------------

    if userId:
        query = query.filter(
            AuditLog.userId == userId
        )

    # --------------------------------------------------------
    # ACTION FILTER
    # --------------------------------------------------------

    if action and action != "ALL":
        query = query.filter(
            AuditLog.action == action
        )

    # --------------------------------------------------------
    # RESOURCE TYPE
    # --------------------------------------------------------

    if resourceType and resourceType != "ALL":
        query = query.filter(
            AuditLog.resourceType == resourceType
        )

    # --------------------------------------------------------
    # STATUS
    # --------------------------------------------------------

    if status_filter and status_filter != "ALL":
        query = query.filter(
            AuditLog.status == status_filter
        )

    # --------------------------------------------------------
    # SEARCH
    # --------------------------------------------------------

    if search:
        search_value = f"%{search}%"

        query = query.filter(
            or_(
                AuditLog.userName.ilike(search_value),
                AuditLog.userEmail.ilike(search_value),
                AuditLog.action.ilike(search_value),
                AuditLog.resourceType.ilike(search_value),
                AuditLog.description.ilike(search_value),
                AuditLog.targetName.ilike(search_value),
                AuditLog.performedBy.ilike(search_value),
            )
        )

    # --------------------------------------------------------
    # DATE FILTER
    # --------------------------------------------------------

    if startDate:
        query = query.filter(
            AuditLog.createdAt >= startDate
        )

    if endDate:
        query = query.filter(
            AuditLog.createdAt <= endDate
        )

    # --------------------------------------------------------
    # TOTAL
    # --------------------------------------------------------

    total = query.count()

    # --------------------------------------------------------
    # SORTING
    # --------------------------------------------------------

    if sortOrder == "asc":
        query = query.order_by(
            AuditLog.createdAt.asc()
        )
    else:
        query = query.order_by(
            AuditLog.createdAt.desc()
        )

    # --------------------------------------------------------
    # PAGINATION
    # --------------------------------------------------------

    offset = (page - 1) * limit

    logs = (
        query
        .offset(offset)
        .limit(limit)
        .all()
    )

    total_pages = (
        (total + limit - 1) // limit
        if total > 0
        else 0
    )

    return AuditLogPaginationResponse(
        items=logs,
        total=total,
        page=page,
        limit=limit,
        totalPages=total_pages,
    )


# ============================================================
# FILTER OPTIONS
# ============================================================

# IMPORTANT:
# This endpoint must come BEFORE /{audit_id}

@router.get(
    "/filters",
    response_model=AuditLogFilterOptionsResponse,
)
def get_filter_options(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    # --------------------------------------------------------
    # ACTIONS
    # --------------------------------------------------------

    actions = [
        row[0]
        for row in (
            db.query(AuditLog.action)
            .filter(
                AuditLog.companyId == admin.company_id
            )
            .distinct()
            .all()
        )
        if row[0]
    ]

    # --------------------------------------------------------
    # RESOURCE TYPES
    # --------------------------------------------------------

    resource_types = [
        row[0]
        for row in (
            db.query(AuditLog.resourceType)
            .filter(
                AuditLog.companyId == admin.company_id
            )
            .distinct()
            .all()
        )
        if row[0]
    ]

    # --------------------------------------------------------
    # STATUSES
    # --------------------------------------------------------

    statuses = [
        row[0]
        for row in (
            db.query(AuditLog.status)
            .filter(
                AuditLog.companyId == admin.company_id
            )
            .distinct()
            .all()
        )
        if row[0]
    ]

    # --------------------------------------------------------
    # USERS
    # --------------------------------------------------------

    users = (
        db.query(User)
        .filter(
            User.company_id == admin.company_id
        )
        .all()
    )

    user_options = [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": getattr(user, "role", None),
        }
        for user in users
    ]

    # --------------------------------------------------------
    # DEFAULT OPTIONS
    # --------------------------------------------------------

    if "ALL" not in actions:
        actions.insert(0, "ALL")

    if "ALL" not in resource_types:
        resource_types.insert(0, "ALL")

    if "ALL" not in statuses:
        statuses.insert(0, "ALL")

    return AuditLogFilterOptionsResponse(
        actions=actions,
        resourceTypes=resource_types,
        users=user_options,
        statuses=statuses,
    )


# ============================================================
# GET SINGLE AUDIT LOG
# ============================================================

@router.get(
    "/{audit_id}",
    response_model=AuditLogResponse,
)
def get_audit_log(
    audit_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    # --------------------------------------------------------
    # COMPANY ISOLATION
    # --------------------------------------------------------

    log = (
        db.query(AuditLog)
        .filter(
            AuditLog.id == audit_id,
            AuditLog.companyId == admin.company_id,
        )
        .first()
    )

    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit log not found",
        )

    return log