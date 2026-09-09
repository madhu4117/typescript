from typing import Literal, Optional

from pydantic import BaseModel, Field


ImportType = Literal[
    "products",
    "customers",
    "sales",
]


class ImportRequest(BaseModel):
    import_type: ImportType


class ImportPreviewRow(BaseModel):
    row_number: int
    data: dict
    valid: bool = True
    errors: list[str] = Field(default_factory=list)
    duplicate: bool = False


class ImportPreviewResponse(BaseModel):
    import_type: str
    filename: str
    total_records: int
    valid_records: int
    invalid_records: int
    duplicate_records: int
    required_columns: list[str]
    detected_columns: list[str] = Field(default_factory=list)
    rows: list[ImportPreviewRow]


class ImportResultResponse(BaseModel):
    import_id: int
    import_type: str
    filename: str

    total_records: int
    successful_records: int
    failed_records: int
    duplicate_records: int

    status: str

    errors: list[dict] = Field(
        default_factory=list
    )


class ImportHistoryResponse(BaseModel):
    id: int
    import_type: str
    filename: str
    total_records: int
    successful_records: int
    failed_records: int
    duplicate_records: int
    status: str
    created_at: Optional[str] = None
    completed_at: Optional[str] = None