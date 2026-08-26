from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class DocumentCreate(BaseModel):
    """Schema for creating a new document (metadata only, file sent separately as multipart)."""

    name: str = Field(..., min_length=1, max_length=255)
    renewal_date: Optional[date] = None


class DocumentUpdate(BaseModel):
    """Schema for updating document metadata (name and/or renewal date)."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    renewal_date: Optional[date] = None
    clear_renewal_date: bool = False  # explicit flag to remove renewal date


class DocumentResponse(BaseModel):
    """Schema for document API responses."""

    id: UUID
    name: str
    original_filename: str
    mime_type: str
    file_size: int
    renewal_date: Optional[date]
    download_url: str
    is_image: bool
    # Computed renewal status fields
    renewal_status: Optional[str]  # None, 'upcoming', 'soon', 'urgent', 'overdue'
    days_until_renewal: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
