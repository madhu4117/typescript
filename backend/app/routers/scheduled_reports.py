import json
import re
from datetime import datetime, time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.scheduled_report import ScheduledReport
from app.services.scheduled_report_service import execute_scheduled_report
from app.utils.security import get_current_user


router = APIRouter(
    prefix="/scheduled-reports",
    tags=["Scheduled Reports"],
)


REPORT_TYPES = {
    "sales",
    "inventory",
    "customer",
    "product_performance",
    "stock_movement",
}

FREQUENCIES = {"Daily", "Weekly", "Monthly"}
EXPORT_FORMATS = {"CSV", "PDF"}


# --------------------------------------------------
# Schemas
# --------------------------------------------------

class ScheduledReportCreate(BaseModel):
    reportType: str
    filters: Optional[dict] = None
    frequency: str
    executionTime: str
    recipients: list[EmailStr] = Field(min_length=1)
    exportFormat: str
    isActive: bool = True

    @field_validator("reportType")
    @classmethod
    def validate_report_type(cls, value: str) -> str:
        if value not in REPORT_TYPES:
            raise ValueError("Invalid report type")
        return value

    @field_validator("frequency")
    @classmethod
    def validate_frequency(cls, value: str) -> str:
        if value not in FREQUENCIES:
            raise ValueError(
                "Frequency must be Daily, Weekly, or Monthly"
            )
        return value

    @field_validator("exportFormat")
    @classmethod
    def validate_export_format(cls, value: str) -> str:
        value = value.upper()
        if value not in EXPORT_FORMATS:
            raise ValueError("Export format must be CSV or PDF")
        return value

    @field_validator("executionTime")
    @classmethod
    def validate_execution_time(cls, value: str) -> str:
        if not re.fullmatch(r"\d{2}:\d{2}", value):
            raise ValueError("Execution time must use HH:MM format")

        try:
            time.fromisoformat(value)
        except ValueError as exc:
            raise ValueError("Invalid execution time") from exc

        return value


class ScheduledReportUpdate(BaseModel):
    reportType: Optional[str] = None
    filters: Optional[dict] = None
    frequency: Optional[str] = None
    executionTime: Optional[str] = None
    recipients: Optional[list[EmailStr]] = Field(
        default=None,
        min_length=1,
    )
    exportFormat: Optional[str] = None
    isActive: Optional[bool] = None

    @field_validator("reportType")
    @classmethod
    def validate_report_type(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in REPORT_TYPES:
            raise ValueError("Invalid report type")
        return value

    @field_validator("frequency")
    @classmethod
    def validate_frequency(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in FREQUENCIES:
            raise ValueError(
                "Frequency must be Daily, Weekly, or Monthly"
            )
        return value

    @field_validator("exportFormat")
    @classmethod
    def validate_export_format(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            value = value.upper()
            if value not in EXPORT_FORMATS:
                raise ValueError("Export format must be CSV or PDF")
        return value

    @field_validator("executionTime")
    @classmethod
    def validate_execution_time(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            if not re.fullmatch(r"\d{2}:\d{2}", value):
                raise ValueError("Execution time must use HH:MM format")
            try:
                time.fromisoformat(value)
            except ValueError as exc:
                raise ValueError("Invalid execution time") from exc
        return value


# --------------------------------------------------
# Helpers
# --------------------------------------------------

def get_user_company_id(user) -> int:
    """
    Your User model uses company_id, while other models
    use companyId. Support either attribute.
    """
    company_id = getattr(user, "company_id", None)

    if company_id is None:
        company_id = getattr(user, "companyId", None)

    if company_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your user account has no company assigned",
        )

    return company_id


def serialize_schedule(schedule: ScheduledReport) -> dict:
    try:
        recipients = json.loads(schedule.recipients)
    except (TypeError, json.JSONDecodeError):
        recipients = []

    try:
        filters = (
            json.loads(schedule.filters)
            if schedule.filters
            else None
        )
    except (TypeError, json.JSONDecodeError):
        filters = None

    return {
        "id": schedule.id,
        "companyId": schedule.companyId,
        "createdBy": schedule.createdBy,
        "reportType": schedule.reportType,
        "filters": filters,
        "frequency": schedule.frequency,
        "executionTime": schedule.executionTime,
        "recipients": recipients,
        "exportFormat": schedule.exportFormat,
        "isActive": schedule.isActive,
        "lastRunAt": schedule.lastRunAt,
        "lastStatus": schedule.lastStatus,
        "lastError": schedule.lastError,
        "nextRunAt": schedule.nextRunAt,
        "createdAt": schedule.createdAt,
        "updatedAt": schedule.updatedAt,
    }


def find_schedule(
    db: Session,
    schedule_id: int,
    company_id: int,
) -> ScheduledReport:
    schedule = (
        db.query(ScheduledReport)
        .filter(
            ScheduledReport.id == schedule_id,
            ScheduledReport.companyId == company_id,
        )
        .first()
    )

    if schedule is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheduled report not found",
        )

    return schedule


# --------------------------------------------------
# Create schedule
# POST /scheduled-reports
# --------------------------------------------------

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
)
def create_scheduled_report(
    payload: ScheduledReportCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    company_id = get_user_company_id(current_user)

    schedule = ScheduledReport(
        companyId=company_id,
        createdBy=current_user.id,
        reportType=payload.reportType,
        filters=(
            json.dumps(payload.filters)
            if payload.filters is not None
            else None
        ),
        frequency=payload.frequency,
        executionTime=payload.executionTime,
        recipients=json.dumps(
            [str(email) for email in payload.recipients]
        ),
        exportFormat=payload.exportFormat,
        isActive=payload.isActive,
        lastStatus="Pending",
    )

    try:
        db.add(schedule)
        db.commit()
        db.refresh(schedule)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create scheduled report",
        )

    return serialize_schedule(schedule)


# --------------------------------------------------
# List schedules
# GET /scheduled-reports
# --------------------------------------------------

@router.get("")
def list_scheduled_reports(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    company_id = get_user_company_id(current_user)

    query = db.query(ScheduledReport).filter(
        ScheduledReport.companyId == company_id
    )

    total = query.count()

    schedules = (
        query.order_by(ScheduledReport.createdAt.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "items": [
            serialize_schedule(item)
            for item in schedules
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": (total + limit - 1) // limit,
    }


# --------------------------------------------------
# Get one schedule
# GET /scheduled-reports/{schedule_id}
# --------------------------------------------------

@router.get("/{schedule_id}")
def get_scheduled_report(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    company_id = get_user_company_id(current_user)

    schedule = find_schedule(
        db,
        schedule_id,
        company_id,
    )

    return serialize_schedule(schedule)


# --------------------------------------------------
# Update schedule
# PUT /scheduled-reports/{schedule_id}
# --------------------------------------------------

@router.put("/{schedule_id}")
def update_scheduled_report(
    schedule_id: int,
    payload: ScheduledReportUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    company_id = get_user_company_id(current_user)

    schedule = find_schedule(
        db,
        schedule_id,
        company_id,
    )

    updates = payload.model_dump(exclude_unset=True)

    for key, value in updates.items():
        if key == "filters":
            schedule.filters = (
                json.dumps(value)
                if value is not None
                else None
            )
        elif key == "recipients":
            schedule.recipients = json.dumps(
                [str(email) for email in value]
            )
        else:
            setattr(schedule, key, value)

    try:
        db.commit()
        db.refresh(schedule)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update scheduled report",
        )

    return serialize_schedule(schedule)


# --------------------------------------------------
# Enable / disable schedule
# PATCH /scheduled-reports/{schedule_id}
# --------------------------------------------------

@router.patch("/{schedule_id}")
def toggle_scheduled_report(
    schedule_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not isinstance(payload.get("isActive"), bool):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="isActive must be a boolean",
        )

    company_id = get_user_company_id(current_user)

    schedule = find_schedule(
        db,
        schedule_id,
        company_id,
    )

    schedule.isActive = payload["isActive"]

    try:
        db.commit()
        db.refresh(schedule)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update scheduled report status",
        )

    return serialize_schedule(schedule)


# --------------------------------------------------
# Delete schedule
# DELETE /scheduled-reports/{schedule_id}
# --------------------------------------------------

@router.delete(
    "/{schedule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_scheduled_report(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    company_id = get_user_company_id(current_user)

    schedule = find_schedule(
        db,
        schedule_id,
        company_id,
    )

    try:
        db.delete(schedule)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete scheduled report",
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --------------------------------------------------
# Run schedule now
# POST /scheduled-reports/{schedule_id}/run
# --------------------------------------------------

@router.post("/{schedule_id}/run")
def run_scheduled_report_now(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    company_id = get_user_company_id(current_user)

    schedule = find_schedule(
        db,
        schedule_id,
        company_id,
    )

    try:
        result = execute_scheduled_report(
            db=db,
            schedule=schedule,
            user_id=current_user.id,
        )
        return {
            "message": "Scheduled report executed successfully",
            "schedule": serialize_schedule(schedule),
            "result": result,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Execution failed: {str(exc)}",
        )