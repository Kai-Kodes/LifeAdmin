from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

from app.schemas.attachment import AttachmentResponse


class ObligationCreate(BaseModel):
    """Schema for creating a new obligation."""

    title: str = Field(..., min_length=1, max_length=255, description="Item name")
    description: Optional[str] = Field(None, description="Brief description")
    category: str = Field(
        "warranty", description="Type: warranty, subscription, insurance, other"
    )
    provider: Optional[str] = Field(None, max_length=255, description="Provider name")
    purchase_date: Optional[date] = Field(None, description="Date of purchase")
    expiry_date: date = Field(..., description="Expiry or renewal date")
    amount: Optional[Decimal] = Field(None, ge=0, description="Purchase price")
    currency: str = Field("INR", max_length=3, description="Currency code")
    notes: Optional[str] = Field(None, description="Additional notes")

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        allowed = {"warranty", "subscription", "insurance", "other"}
        v_lower = v.lower().strip()
        if v_lower not in allowed:
            raise ValueError(f"Category must be one of: {', '.join(sorted(allowed))}")
        return v_lower

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        return v.upper().strip()

    @model_validator(mode="after")
    def validate_dates(self) -> "ObligationCreate":
        if self.purchase_date and self.expiry_date:
            if self.purchase_date > self.expiry_date:
                raise ValueError("Purchase date should not be after expiry date")
        return self


class ObligationUpdate(BaseModel):
    """Schema for updating an existing obligation. All fields are optional."""

    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    provider: Optional[str] = Field(None, max_length=255)
    purchase_date: Optional[date] = None
    expiry_date: Optional[date] = None
    amount: Optional[Decimal] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=3)
    status: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        allowed = {"warranty", "subscription", "insurance", "other"}
        v_lower = v.lower().strip()
        if v_lower not in allowed:
            raise ValueError(f"Category must be one of: {', '.join(sorted(allowed))}")
        return v_lower

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        allowed = {"active", "cancelled"}
        v_lower = v.lower().strip()
        if v_lower not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(sorted(allowed))}")
        return v_lower

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return v.upper().strip()


class ObligationResponse(BaseModel):
    """Schema for obligation API responses. Includes computed fields."""

    id: UUID
    title: str
    description: Optional[str]
    category: str
    provider: Optional[str]
    purchase_date: Optional[date]
    expiry_date: date
    amount: Optional[Decimal]
    currency: str
    status: str
    computed_status: str
    days_remaining: int
    notes: Optional[str]
    attachments: list[AttachmentResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DashboardResponse(BaseModel):
    """Schema for dashboard summary statistics."""

    total: int
    active: int
    expiring_soon: int
    expired: int
