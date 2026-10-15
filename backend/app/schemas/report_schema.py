from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ReportFilters(BaseModel):
    fromDate: Optional[date] = None
    toDate: Optional[date] = None

    productId: Optional[int] = None
    categoryId: Optional[int] = None
    brand: Optional[str] = None
    customerId: Optional[int] = None

    salesStatus: Optional[str] = None
    stockStatus: Optional[str] = None
    userId: Optional[int] = None


class ReportGenerateRequest(BaseModel):
    reportType: str
    filters: ReportFilters = Field(default_factory=ReportFilters)


class ReportRow(BaseModel):
    data: Dict[str, Any]


class ReportResponse(BaseModel):
    reportType: str
    reportName: str

    filters: ReportFilters

    items: List[Dict[str, Any]]

    total: int
    page: int
    limit: int
    totalPages: int

    generatedAt: datetime


class ReportHistoryResponse(BaseModel):
    id: int
    companyId: int
    userId: int
    reportType: str
    reportName: str
    filters: Optional[str]
    format: str
    status: str
    filePath: Optional[str]
    errorMessage: Optional[str]
    createdAt: datetime
    completedAt: Optional[datetime]

    class Config:
        from_attributes = True