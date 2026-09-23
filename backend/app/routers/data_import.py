import csv
import io
import json
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Response,
    UploadFile,
)
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.import_service import (
    preview_import,
    process_import,
    get_sample_csv,
    REQUIRED_COLUMNS,
)
from app.models.import_history import ImportHistory
from app.models.import_error import ImportError
from app.models.user import User
from app.utils.security import get_current_admin
from app.services.audit_service import create_audit_log


router = APIRouter(
    prefix="/data-import",
    tags=["Data Import"],
)


# ============================================================
# TEMPLATE DOWNLOAD
# ============================================================

@router.get("/template/{import_type}")
def download_template(
    import_type: str,
    current_user=Depends(get_current_admin),
):
    import_type_lower = import_type.lower()
    if import_type_lower not in REQUIRED_COLUMNS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid import type '{import_type}'. Supported types: {', '.join(REQUIRED_COLUMNS.keys())}",
        )

    content = get_sample_csv(import_type_lower)
    filename = f"{import_type_lower}_import_template.csv"

    return Response(
        content=content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )


# ============================================================
# PREVIEW & VALIDATE CSV
# ============================================================

@router.post("/preview")
async def preview_csv(
    import_type: str = Form(...),
    file: UploadFile = File(...),
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    import_type_lower = import_type.lower()
    if import_type_lower not in REQUIRED_COLUMNS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid import type. Allowed: {', '.join(REQUIRED_COLUMNS.keys())}",
        )

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="File name is required",
        )

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV (.csv) files are supported",
        )

    content = await file.read()
    if not content or len(content.strip()) == 0:
        raise HTTPException(
            status_code=400,
            detail="The uploaded CSV file is empty",
        )

    # Validate file size (max 10MB)
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds maximum allowed limit of 10MB",
        )

    try:
        result = preview_import(
            db=db,
            company_id=current_user.company_id,
            import_type=import_type_lower,
            file_bytes=content,
        )
        result["filename"] = file.filename
        return result

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Preview error: {str(error)}",
        )


# ============================================================
# PROCESS IMPORT
# ============================================================

@router.post("/import")
async def import_csv(
    import_type: str = Form(...),
    file: UploadFile = File(...),
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    import_type_lower = import_type.lower()
    if import_type_lower not in REQUIRED_COLUMNS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid import type. Allowed: {', '.join(REQUIRED_COLUMNS.keys())}",
        )

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="File name is required",
        )

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV (.csv) files are supported",
        )

    content = await file.read()
    if not content or len(content.strip()) == 0:
        raise HTTPException(
            status_code=400,
            detail="The uploaded CSV file is empty",
        )

    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds maximum allowed limit of 10MB",
        )

    try:
        result = process_import(
            db=db,
            company_id=current_user.company_id,
            user_id=current_user.id,
            import_type=import_type_lower,
            filename=file.filename,
            file_bytes=content,
        )

        # Record audit log for data import
        create_audit_log(
            db=db,
            company_id=current_user.company_id,
            user_id=current_user.id,
            user_name=current_user.name,
            user_email=current_user.email,
            action="IMPORT",
            resource_type="DataImport",
            resource_id=result.get("import_id") if isinstance(result, dict) else None,
            description=f"Imported {result.get('successful_records', 0)} {import_type_lower} records from {file.filename}",
            after_data={
                "total": result.get("total_records", 0) if isinstance(result, dict) else 0,
                "success": result.get("successful_records", 0) if isinstance(result, dict) else 0,
                "failed": result.get("failed_records", 0) if isinstance(result, dict) else 0,
            },
            status="SUCCESS",
        )

        return result

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )
    except Exception as error:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process import: {str(error)}",
        )


# ============================================================
# IMPORT HISTORY LIST
# ============================================================

@router.get("/history")
def get_import_history(
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    # Join with User to show human-readable uploader name
    records = (
        db.query(ImportHistory, User.name.label("uploader_name"))
        .outerjoin(User, ImportHistory.uploaded_by == User.id)
        .filter(ImportHistory.company_id == current_user.company_id)
        .order_by(ImportHistory.created_at.desc())
        .all()
    )

    return [
        {
            "id": record.ImportHistory.id,
            "import_type": record.ImportHistory.import_type,
            "filename": record.ImportHistory.filename,
            "uploaded_by": record.ImportHistory.uploaded_by,
            "uploaded_by_name": record.uploader_name or f"User #{record.ImportHistory.uploaded_by}",
            "total_records": record.ImportHistory.total_records,
            "successful_records": record.ImportHistory.successful_records,
            "failed_records": record.ImportHistory.failed_records,
            "duplicate_records": record.ImportHistory.duplicate_records,
            "status": record.ImportHistory.status,
            "created_at": (
                record.ImportHistory.created_at.isoformat()
                if record.ImportHistory.created_at
                else None
            ),
            "completed_at": (
                record.ImportHistory.completed_at.isoformat()
                if record.ImportHistory.completed_at
                else None
            ),
        }
        for record in records
    ]


# ============================================================
# SINGLE IMPORT HISTORY DETAILS
# ============================================================

@router.get("/history/{import_id}")
def get_import_by_id(
    import_id: int,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    record = (
        db.query(ImportHistory, User.name.label("uploader_name"))
        .outerjoin(User, ImportHistory.uploaded_by == User.id)
        .filter(
            ImportHistory.id == import_id,
            ImportHistory.company_id == current_user.company_id,
        )
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Import record not found",
        )

    return {
        "id": record.ImportHistory.id,
        "import_type": record.ImportHistory.import_type,
        "filename": record.ImportHistory.filename,
        "uploaded_by": record.ImportHistory.uploaded_by,
        "uploaded_by_name": record.uploader_name or f"User #{record.ImportHistory.uploaded_by}",
        "total_records": record.ImportHistory.total_records,
        "successful_records": record.ImportHistory.successful_records,
        "failed_records": record.ImportHistory.failed_records,
        "duplicate_records": record.ImportHistory.duplicate_records,
        "status": record.ImportHistory.status,
        "created_at": (
            record.ImportHistory.created_at.isoformat()
            if record.ImportHistory.created_at
            else None
        ),
        "completed_at": (
            record.ImportHistory.completed_at.isoformat()
            if record.ImportHistory.completed_at
            else None
        ),
    }


# ============================================================
# FAILED RECORDS LOGS
# ============================================================

@router.get("/history/{import_id}/errors")
def get_import_errors(
    import_id: int,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    history = (
        db.query(ImportHistory)
        .filter(
            ImportHistory.id == import_id,
            ImportHistory.company_id == current_user.company_id,
        )
        .first()
    )

    if not history:
        raise HTTPException(
            status_code=404,
            detail="Import record not found",
        )

    errors = (
        db.query(ImportError)
        .filter(ImportError.import_id == import_id)
        .order_by(ImportError.row_number.asc())
        .all()
    )

    return [
        {
            "id": error.id,
            "row_number": error.row_number,
            "error_type": error.error_type,
            "field": error.field,
            "error_message": error.error_message,
            "row_data": (
                json.loads(error.row_data) if error.row_data else {}
            ),
        }
        for error in errors
    ]


# ============================================================
# DOWNLOAD FAILED RECORDS CSV
# ============================================================

@router.get("/history/{import_id}/errors/download")
def download_failed_records(
    import_id: int,
    current_user=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    history = (
        db.query(ImportHistory)
        .filter(
            ImportHistory.id == import_id,
            ImportHistory.company_id == current_user.company_id,
        )
        .first()
    )

    if not history:
        raise HTTPException(
            status_code=404,
            detail="Import record not found",
        )

    errors = (
        db.query(ImportError)
        .filter(ImportError.import_id == import_id)
        .order_by(ImportError.row_number.asc())
        .all()
    )

    # Reconstruct original CSV columns + Error Reason column
    headers_set = []
    parsed_error_rows = []

    for err in errors:
        row_dict = {}
        if err.row_data:
            try:
                row_dict = json.loads(err.row_data)
            except Exception:
                row_dict = {}
        for k in row_dict.keys():
            if k not in headers_set:
                headers_set.append(k)
        parsed_error_rows.append((err, row_dict))

    csv_headers = ["Row Number", "Error Type", "Error Message"] + headers_set

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(csv_headers)

    for err, row_dict in parsed_error_rows:
        row_values = [
            err.row_number,
            err.error_type,
            err.error_message,
        ] + [row_dict.get(h, "") for h in headers_set]
        writer.writerow(row_values)

    output.seek(0)
    filename = f"failed_{history.import_type}_import_{import_id}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )