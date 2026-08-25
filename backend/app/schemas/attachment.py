from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class AttachmentResponse(BaseModel):
    """Schema for attachment API responses."""

    id: UUID
    obligation_id: UUID
    original_filename: str
    mime_type: str
    file_size: int
    download_url: str
    is_image: bool
    created_at: datetime

    model_config = {"from_attributes": True}


def format_file_size(size_bytes: int) -> str:
    """Format file size in human-readable form."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
