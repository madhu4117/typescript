import json
import math
import os
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Response,
    status,
)
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.report_history import ReportHistory
from app.models.user import User
from app.schemas.report_schema import ReportFilters, ReportGenerateRequest
from app.services.report_export_service import (
    export_report_csv,
    export_report_pdf,
    save_exported_file,
)
from app.services.report_service import REPORT_NAMES, generate_report
from app.utils.security import get_current_user


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


class ReportExportRequest(BaseModel):
    reportType: str
    filters: ReportFilters = Field(default_factory=ReportFilters)
    format: str = Field(default="CSV")  # "CSV" or "PDF"


def _get_company_id(user: User) -> int:
    cid = getattr(user, "company_id", None)
    if cid is None:
        cid = getattr(user, "companyId", None)
    if cid is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your user account has no company assigned",
        )
    return cid


@router.post("/generate")
def generate_report_api(
    request: ReportGenerateRequest,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company_id = _get_company_id(current_user)
    report_type = request.reportType.lower()

    if report_type not in REPORT_NAMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid report type. Allowed: {list(REPORT_NAMES.keys())}",
        )

    filters = request.filters.model_dump(exclude_none=True)

    try:
        rows = generate_report(
            db=db,
            company_id=company_id,
            report_type=report_type,
            filters=filters,
        )

        total = len(rows)
        start = (page - 1) * limit
        end = start + limit
        paginated_rows = rows[start:end]

        history = ReportHistory(
            companyId=company_id,
            userId=current_user.id,
            reportType=report_type,
            reportName=REPORT_NAMES[report_type],
            filters=json.dumps(filters, default=str),
            format="VIEW",
            status="Success",
            createdAt=datetime.now(timezone.utc),
            completedAt=datetime.now(timezone.utc),
        )

        db.add(history)
        db.commit()

        return {
            "reportType": report_type,
            "reportName": REPORT_NAMES[report_type],
            "filters": filters,
            "items": paginated_rows,
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": math.ceil(total / limit) if total else 0,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
        }

    except Exception as exc:
        db.rollback()
        history = ReportHistory(
            companyId=company_id,
            userId=current_user.id,
            reportType=report_type,
            reportName=REPORT_NAMES.get(report_type, report_type),
            filters=json.dumps(filters, default=str),
            format="VIEW",
            status="Failed",
            errorMessage=str(exc),
            createdAt=datetime.now(timezone.utc),
        )
        db.add(history)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report generation failed: {str(exc)}",
        )


@router.post("/export")
def export_report_api(
    request: ReportExportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company_id = _get_company_id(current_user)
    report_type = request.reportType.lower()
    export_format = request.format.upper()

    if report_type not in REPORT_NAMES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid report type. Allowed: {list(REPORT_NAMES.keys())}",
        )

    if export_format not in ["CSV", "PDF"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Export format must be CSV or PDF",
        )

    filters = request.filters.model_dump(exclude_none=True)
    report_name = REPORT_NAMES[report_type]
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    try:
        rows = generate_report(
            db=db,
            company_id=company_id,
            report_type=report_type,
            filters=filters,
        )

        if export_format == "CSV":
            content_str = export_report_csv(report_name, filters, rows)
            content_bytes = content_str.encode("utf-8-sig")
            filename = f"{report_type}_report_{timestamp}.csv"
            media_type = "text/csv; charset=utf-8"
        else:
            content_bytes = export_report_pdf(report_name, filters, rows)
            filename = f"{report_type}_report_{timestamp}.pdf"
            media_type = "application/pdf"

        file_path = save_exported_file(filename, content_bytes)

        history = ReportHistory(
            companyId=company_id,
            userId=current_user.id,
            reportType=report_type,
            reportName=report_name,
            filters=json.dumps(filters, default=str),
            format=export_format,
            status="Success",
            filePath=file_path,
            createdAt=datetime.now(timezone.utc),
            completedAt=datetime.now(timezone.utc),
        )
        db.add(history)
        db.commit()

        return Response(
            content=content_bytes,
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
            },
        )

    except Exception as exc:
        db.rollback()
        history = ReportHistory(
            companyId=company_id,
            userId=current_user.id,
            reportType=report_type,
            reportName=report_name,
            filters=json.dumps(filters, default=str),
            format=export_format,
            status="Failed",
            errorMessage=str(exc),
            createdAt=datetime.now(timezone.utc),
        )
        db.add(history)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report export failed: {str(exc)}",
        )


@router.get("/history")
def get_report_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company_id = _get_company_id(current_user)

    query = (
        db.query(ReportHistory, User.name.label("generatedBy"))
        .outerjoin(User, User.id == ReportHistory.userId)
        .filter(ReportHistory.companyId == company_id)
    )

    total = query.count()
    rows = (
        query.order_by(ReportHistory.createdAt.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    items = []
    for hist, user_name in rows:
        items.append(
            {
                "id": hist.id,
                "companyId": hist.companyId,
                "userId": hist.userId,
                "generatedBy": user_name or f"User #{hist.userId}",
                "reportType": hist.reportType,
                "reportName": hist.reportName,
                "filters": hist.filters,
                "format": hist.format,
                "status": hist.status,
                "filePath": hist.filePath,
                "errorMessage": hist.errorMessage,
                "createdAt": hist.createdAt.isoformat() if hist.createdAt else None,
                "completedAt": hist.completedAt.isoformat() if hist.completedAt else None,
            }
        )

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": math.ceil(total / limit) if total else 0,
    }


@router.get("/history/{history_id}/download")
def download_history_report(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company_id = _get_company_id(current_user)

    hist = (
        db.query(ReportHistory)
        .filter(
            ReportHistory.id == history_id,
            ReportHistory.companyId == company_id,
        )
        .first()
    )

    if not hist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report history record not found",
        )

    # Check if existing cached file is present on disk
    if hist.filePath and os.path.exists(hist.filePath):
        with open(hist.filePath, "rb") as f:
            content_bytes = f.read()
        filename = os.path.basename(hist.filePath)
        media_type = (
            "text/csv; charset=utf-8" if filename.endswith(".csv") else "application/pdf"
        )
        return Response(
            content=content_bytes,
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
            },
        )

    # If file was removed or was VIEW format, regenerate export on the fly
    fmt = "PDF" if hist.format.upper() == "PDF" else "CSV"
    filters = json.loads(hist.filters) if hist.filters else {}
    rows = generate_report(
        db=db,
        company_id=company_id,
        report_type=hist.reportType,
        filters=filters,
    )

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    if fmt == "CSV":
        content_str = export_report_csv(hist.reportName, filters, rows)
        content_bytes = content_str.encode("utf-8-sig")
        filename = f"{hist.reportType}_report_{timestamp}.csv"
        media_type = "text/csv; charset=utf-8"
    else:
        content_bytes = export_report_pdf(hist.reportName, filters, rows)
        filename = f"{hist.reportType}_report_{timestamp}.pdf"
        media_type = "application/pdf"

    return Response(
        content=content_bytes,
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )