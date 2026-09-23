import json
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, Any, Dict, Tuple
from fastapi import Request
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.models.user import User


class AuditJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle dates, decimals, and complex objects."""
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        if hasattr(obj, "__dict__"):
            return {k: v for k, v in obj.__dict__.items() if not k.startswith("_")}
        return str(obj)


def serialize_data(data: Any) -> Optional[str]:
    """Safely serialize data to a JSON string."""
    if data is None:
        return None
    if isinstance(data, str):
        return data
    try:
        return json.dumps(data, cls=AuditJSONEncoder, default=str)
    except Exception:
        return str(data)


def extract_request_info(request: Optional[Request]) -> Tuple[Optional[str], Optional[str]]:
    """Extract client IP address and User-Agent header from request."""
    if not request:
        return None, None

    ip_address = None
    # Check X-Forwarded-For header first (useful if behind proxy/load balancer)
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        ip_address = x_forwarded_for.split(",")[0].strip()
    elif request.headers.get("x-real-ip"):
        ip_address = request.headers.get("x-real-ip")
    elif request.client:
        ip_address = request.client.host

    user_agent = request.headers.get("user-agent")
    return ip_address, user_agent


def compute_dict_diff(before: Optional[Dict[str, Any]], after: Optional[Dict[str, Any]]) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    """
    Compare two dictionaries and return only keys that changed.
    Returns (before_diff, after_diff).
    """
    if not before and not after:
        return None, None
    if not before:
        return None, after
    if not after:
        return before, None

    before_diff = {}
    after_diff = {}

    all_keys = set(before.keys()).union(set(after.keys()))
    for k in all_keys:
        v_before = before.get(k)
        v_after = after.get(k)
        # Compare strings or values
        if v_before != v_after:
            before_diff[k] = v_before
            after_diff[k] = v_after

    return (before_diff if before_diff else None, after_diff if after_diff else None)


def create_audit_log(
    db: Session,
    company_id: int,
    user_id: Optional[int] = None,
    user_name: Optional[str] = None,
    user_email: Optional[str] = None,
    action: str = "UNKNOWN",
    resource_type: str = "System",
    resource_id: Optional[int] = None,
    description: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    before_data: Optional[Any] = None,
    after_data: Optional[Any] = None,
    status: str = "SUCCESS",
) -> AuditLog:
    """
    Record an administrative or user action into the audit log.
    Ensures company isolation and captures structured before/after data.
    """
    # If user_id provided without name/email, look up user
    if user_id and (not user_name or not user_email):
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user_name = user_name or user.name
            user_email = user_email or user.email

    audit_entry = AuditLog(
        companyId=company_id,
        userId=user_id,
        userName=user_name,
        userEmail=user_email,
        action=action,
        resourceType=resource_type,
        resourceId=resource_id,
        description=description,
        ipAddress=ip_address,
        userAgent=user_agent,
        beforeData=serialize_data(before_data),
        afterData=serialize_data(after_data),
        status=status,
        targetName=description or f"{resource_type} #{resource_id or ''}",
        performedBy=f"{user_name} ({user_email})" if (user_name and user_email) else (user_name or "System"),
    )

    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry


def log_event(
    db: Session,
    company_id: int,
    target_name: str,
    action: str,
    performed_by: str,
    **kwargs
) -> AuditLog:
    """
    Backward-compatible log_event function that handles legacy calls
    and routes them into structured audit log creation.
    """
    # Attempt to resolve user from performed_by string (e.g., "Madhu (madhu@example.com)")
    user_id = kwargs.get("user_id")
    user_name = None
    user_email = None

    if performed_by:
        if "(" in performed_by and ")" in performed_by:
            parts = performed_by.split("(")
            user_name = parts[0].strip()
            user_email = parts[1].replace(")", "").strip()
        else:
            user_name = performed_by.strip()

    if not user_id and user_email:
        user = db.query(User).filter(User.email == user_email).first()
        if user:
            user_id = user.id

    # Infer resourceType and action if not provided
    resource_type = kwargs.get("resource_type")
    if not resource_type:
        act_lower = action.lower()
        if "product" in act_lower:
            resource_type = "Product"
        elif "category" in act_lower:
            resource_type = "Category"
        elif "sale" in act_lower:
            resource_type = "Sale"
        elif "customer" in act_lower:
            resource_type = "Customer"
        elif "stock" in act_lower or "inventory" in act_lower:
            resource_type = "Inventory"
        elif "import" in act_lower:
            resource_type = "DataImport"
        elif "login" in act_lower:
            resource_type = "Auth"
        else:
            resource_type = "System"

    description = kwargs.get("description") or f"{action}: {target_name}"

    return create_audit_log(
        db=db,
        company_id=company_id,
        user_id=user_id,
        user_name=user_name,
        user_email=user_email,
        action=action,
        resource_type=resource_type,
        resource_id=kwargs.get("resource_id"),
        description=description,
        ip_address=kwargs.get("ip_address"),
        user_agent=kwargs.get("user_agent"),
        before_data=kwargs.get("before_data"),
        after_data=kwargs.get("after_data"),
        status=kwargs.get("status", "SUCCESS"),
    )
