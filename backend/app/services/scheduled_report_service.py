import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from app.models.report_history import ReportHistory
from app.models.scheduled_report import ScheduledReport
from app.services.report_export_service import (
    export_report_csv,
    export_report_pdf,
    save_exported_file,
)
from app.services.report_service import REPORT_NAMES, generate_report


def execute_scheduled_report(
    db: Session,
    schedule: ScheduledReport,
    user_id: Optional[int] = None,
) -> Dict[str, Any]:
    """Execute a scheduled report generation run, store export file, and log history."""
    report_type = schedule.reportType.lower()
    report_name = REPORT_NAMES.get(report_type, report_type)
    export_format = (schedule.exportFormat or "CSV").upper()
    filters = json.loads(schedule.filters) if schedule.filters else {}
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    try:
        rows = generate_report(
            db=db,
            company_id=schedule.companyId,
            report_type=report_type,
            filters=filters,
        )

        if export_format == "CSV":
            content_str = export_report_csv(report_name, filters, rows)
            content_bytes = content_str.encode("utf-8-sig")
            filename = f"scheduled_{report_type}_{timestamp}.csv"
        else:
            content_bytes = export_report_pdf(report_name, filters, rows)
            filename = f"scheduled_{report_type}_{timestamp}.pdf"

        file_path = save_exported_file(filename, content_bytes)

        # Record into history
        history = ReportHistory(
            companyId=schedule.companyId,
            userId=user_id or schedule.createdBy,
            reportType=report_type,
            reportName=f"{report_name} (Scheduled)",
            filters=schedule.filters,
            format=export_format,
            status="Success",
            filePath=file_path,
            createdAt=datetime.now(timezone.utc),
            completedAt=datetime.now(timezone.utc),
        )
        db.add(history)

        # Update schedule status
        schedule.lastRunAt = datetime.now(timezone.utc)
        schedule.lastStatus = "Success"
        schedule.lastError = None

        db.commit()
        db.refresh(schedule)

        return {
            "status": "Success",
            "scheduleId": schedule.id,
            "reportType": report_type,
            "totalRows": len(rows),
            "filePath": file_path,
            "lastRunAt": schedule.lastRunAt.isoformat(),
        }

    except Exception as exc:
        db.rollback()
        schedule.lastRunAt = datetime.now(timezone.utc)
        schedule.lastStatus = "Failed"
        schedule.lastError = str(exc)

        history = ReportHistory(
            companyId=schedule.companyId,
            userId=user_id or schedule.createdBy,
            reportType=report_type,
            reportName=f"{report_name} (Scheduled)",
            filters=schedule.filters,
            format=export_format,
            status="Failed",
            errorMessage=str(exc),
            createdAt=datetime.now(timezone.utc),
        )
        db.add(history)
        db.commit()

        raise exc
