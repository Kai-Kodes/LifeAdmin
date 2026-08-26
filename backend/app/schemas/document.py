from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class DocumentCreate(BaseModel):
    """Schema for creating a document."""

    name: str = Field(..., min_length=1, max_length=255, description="Document display name")
    renewal_date: Optional[date] = Field(None, description="Optional renewal date")


class DocumentUpdate(BaseModel):
    """Schema for updating document metadata."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    renewal_date: Optional[date] = Field(None, description="New renewal date if provided")
    clear_renewal_date: bool = Field(False, description="Set to true to remove existing renewal date")


class DocumentResponse(BaseModel):
    """Schema for document API responses."""

    id: UUID
    name: str
    original_filename: str
    mime_type: str
    file_size: int
    formatted_file_size: str
    renewal_date: Optional[date]
    computed_status: Optional[str]  # 'active', 'expiring_soon', 'urgent', 'expired', or None
    renewal_status_label: Optional[str]  # e.g., "Renews in 20 days", "Renewal overdue", etc.
    days_remaining: Optional[int]
    download_url: str
    is_image: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
