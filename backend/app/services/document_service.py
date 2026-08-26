import logging
import os
import uuid
from datetime import date, datetime
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, UploadFile
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.document import Document
from app.schemas.attachment import format_file_size
from app.schemas.document import DocumentResponse, DocumentUpdate
from app.services.attachment_service import (
    IMAGE_MIME_TYPES,
    validate_file,
)
from app.services.storage import _sanitize_filename, get_storage

logger = logging.getLogger(__name__)


def generate_document_storage_path(original_filename: str) -> str:
    """Generate a safe, unique storage path for a document file."""
    safe_name = _sanitize_filename(original_filename)
    unique_prefix = uuid.uuid4().hex[:12]
    return f"documents/{unique_prefix}_{safe_name}"


def compute_renewal_status(
    renewal_date: Optional[date],
) -> tuple[Optional[str], Optional[str], Optional[int]]:
    """
    Compute status, human label, and days remaining for a document renewal date.

    Returns:
        (computed_status, renewal_status_label, days_remaining)
    """
    if not renewal_date:
        return None, None, None

    today = date.today()
    days = (renewal_date - today).days

    if days < 0:
        abs_days = abs(days)
        label = f"Renewal overdue by {abs_days} day{'s' if abs_days != 1 else ''}"
        return "expired", label, days
    elif days == 0:
        return "urgent", "Renews today", 0
    elif days <= 7:
        return "urgent", f"Renews in {days} day{'s' if days != 1 else ''}", days
    elif days <= 30:
        return "expiring_soon", f"Renews in {days} day{'s' if days != 1 else ''}", days
    else:
        return "active", f"Renews in {days} days", days


def _to_response(document: Document) -> DocumentResponse:
    """Convert Document model to response schema."""
    computed_status, label, days_remaining = compute_renewal_status(
        document.renewal_date
    )
    return DocumentResponse(
        id=document.id,
        name=document.name,
        original_filename=document.original_filename,
        mime_type=document.mime_type,
        file_size=document.file_size,
        formatted_file_size=format_file_size(document.file_size),
        renewal_date=document.renewal_date,
        computed_status=computed_status,
        renewal_status_label=label,
        days_remaining=days_remaining,
        download_url=f"/api/documents/{document.id}/download",
        is_image=document.mime_type in IMAGE_MIME_TYPES,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


def create_document(
    db: Session,
    name: str,
    renewal_date: Optional[date],
    file: UploadFile,
    file_data: bytes,
) -> DocumentResponse:
    """Validate file, save to storage, and create document record."""
    validate_file(file, file_data)

    original_filename = file.filename or "document"
    storage_path = generate_document_storage_path(original_filename)

    storage = get_storage()
    try:
        storage.save(storage_path, file_data)
    except Exception as e:
        logger.error(f"Storage save failed for document: {e}")
        raise HTTPException(
            status_code=500, detail="Document upload failed. Please try again."
        )

    doc = Document(
        name=name.strip(),
        original_filename=original_filename,
        storage_path=storage_path,
        mime_type=file.content_type or "application/octet-stream",
        file_size=len(file_data),
        renewal_date=renewal_date,
    )

    try:
        db.add(doc)
        db.commit()
        db.refresh(doc)
    except Exception as e:
        logger.error(f"DB insert failed for document: {e}")
        storage.delete(storage_path)
        db.rollback()
        raise HTTPException(
            status_code=500, detail="Document creation failed. Please try again."
        )

    return _to_response(doc)


def list_documents(
    db: Session, search: Optional[str] = None, sort_by: str = "created_at"
) -> list[DocumentResponse]:
    """List documents with optional filtering and sorting."""
    query = db.query(Document)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Document.name.ilike(term),
                Document.original_filename.ilike(term),
            )
        )

    if sort_by == "name":
        query = query.order_by(Document.name.asc())
    elif sort_by == "renewal_date":
        query = query.order_by(Document.renewal_date.asc().nulls_last())
    else:  # 'created_at' or default
        query = query.order_by(Document.created_at.desc())

    documents = query.all()
    return [_to_response(d) for d in documents]


def get_document(db: Session, document_id: UUID) -> Optional[Document]:
    """Get raw Document DB model instance."""
    return db.query(Document).filter(Document.id == document_id).first()


def get_document_response(db: Session, document_id: UUID) -> DocumentResponse:
    """Get single document response schema."""
    doc = get_document(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return _to_response(doc)


def update_document(
    db: Session, document_id: UUID, update_data: DocumentUpdate
) -> DocumentResponse:
    """Update document name and/or renewal_date."""
    doc = get_document(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if update_data.name is not None:
        doc.name = update_data.name.strip()

    if update_data.clear_renewal_date:
        doc.renewal_date = None
    elif update_data.renewal_date is not None:
        doc.renewal_date = update_data.renewal_date

    db.commit()
    db.refresh(doc)
    return _to_response(doc)


def replace_document_file(
    db: Session, document_id: UUID, file: UploadFile, file_data: bytes
) -> DocumentResponse:
    """Replace the file associated with a document."""
    doc = get_document(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    validate_file(file, file_data)

    old_storage_path = doc.storage_path
    original_filename = file.filename or doc.original_filename
    new_storage_path = generate_document_storage_path(original_filename)

    storage = get_storage()
    try:
        storage.save(new_storage_path, file_data)
    except Exception as e:
        logger.error(f"Failed to save replacement file for document {document_id}: {e}")
        raise HTTPException(
            status_code=500, detail="File replacement failed. Please try again."
        )

    doc.original_filename = original_filename
    doc.storage_path = new_storage_path
    doc.mime_type = file.content_type or "application/octet-stream"
    doc.file_size = len(file_data)

    try:
        db.commit()
        db.refresh(doc)
    except Exception as e:
        logger.error(f"DB update failed during file replacement: {e}")
        storage.delete(new_storage_path)
        db.rollback()
        raise HTTPException(
            status_code=500, detail="File replacement failed. Please try again."
        )

    # Clean up old file (best effort)
    storage.delete(old_storage_path)

    return _to_response(doc)


def delete_document(db: Session, document_id: UUID) -> bool:
    """Delete document metadata and storage file."""
    doc = get_document(db, document_id)
    if not doc:
        return False

    storage_path = doc.storage_path

    try:
        db.delete(doc)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to delete document DB record {document_id}: {e}")
        db.rollback()
        return False

    storage = get_storage()
    if not storage.delete(storage_path):
        logger.warning(
            f"Orphaned file in storage: {storage_path} (document {document_id} deleted from DB)"
        )

    return True
