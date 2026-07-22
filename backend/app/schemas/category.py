from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    status: str = Field("Active", max_length=20)


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    status: Optional[str] = Field(None, max_length=20)


class CategoryResponse(CategoryBase):
    id: int
    companyId: int
    product_count: int = 0
    createdAt: datetime
    updatedAt: datetime

    model_config = {
    "from_attributes": True
}