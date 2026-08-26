from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.attachment import AttachmentResponse


class BillCreate(BaseModel):
    """Schema for creating a bill."""

    name: str = Field(..., min_length=1, max_length=255, description="Bill title/name")
    due_date: date = Field(..., description="Mandatory due date ('to pay by')")
    amount: Optional[float] = Field(None, ge=0, description="Optional bill amount")
    currency: str = Field("INR", max_length=10, description="Currency code (e.g. INR, USD)")
    notes: Optional[str] = Field(None, description="Optional notes or reference numbers")


class BillUpdate(BaseModel):
    """Schema for updating a bill."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    due_date: Optional[date] = Field(None, description="Mandatory due date")
    amount: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=10)
    notes: Optional[str] = Field(None)
    is_paid: Optional[bool] = Field(None)


class BillResponse(BaseModel):
    """Schema for bill API responses."""

    id: UUID
    name: str
    due_date: date
    amount: Optional[float]
    currency: str
    notes: Optional[str]
    is_paid: bool
    computed_status: str  # 'paid', 'overdue', 'due_today', 'due_soon', 'upcoming'
    status_label: str  # e.g., "Paid", "Overdue by 4 days", "Due today", "Due in 5 days"
    days_remaining: Optional[int]
    attachment: Optional[AttachmentResponse] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
