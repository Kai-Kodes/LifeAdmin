import logging
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.models.attachment import Attachment
from app.models.obligation import Obligation
from app.schemas.attachment import AttachmentResponse
from app.services.file_validation import IMAGE_MIME_TYPES, validate_file
from app.services.storage import generate_storage_path, get_storage

logger = logging.getLogger(__name__)


def _to_response(attachment: Attachment) -> AttachmentResponse:
    """Convert an Attachment model to a response schema."""
    return AttachmentResponse(
        id=attachment.id,
        obligation_id=attachment.obligation_id,
        original_filename=attachment.original_filename,
        mime_type=attachment.mime_type,
        file_size=attachment.file_size,
        download_url=f"/api/attachments/{attachment.id}/download",
        is_image=attachment.mime_type in IMAGE_MIME_TYPES,
        created_at=attachment.created_at,
    )


def upload_attachment(
    db: Session, obligation_id: UUID, file: UploadFile, file_data: bytes
) -> AttachmentResponse:
    """Upload a file and create attachment metadata."""
    # Verify obligation exists
    obligation = db.query(Obligation).filter(Obligation.id == obligation_id).first()
    if not obligation:
        raise HTTPException(status_code=404, detail="Obligation not found")

    # Validate file
    validate_file(file, file_data)

    # Generate storage path
    storage_path = generate_storage_path(str(obligation_id), file.filename or "file")

    # Save file to storage
    storage = get_storage()
    try:
        storage.save(storage_path, file_data)
    except Exception as e:
        logger.error(f"Storage save failed: {e}")
        raise HTTPException(status_code=500, detail="Upload failed. Please try again.")

    # Create database record
    attachment = Attachment(
        obligation_id=obligation_id,
        original_filename=file.filename or "file",
        storage_path=storage_path,
        mime_type=file.content_type or "application/octet-stream",
        file_size=len(file_data),
    )

    try:
        db.add(attachment)
        db.commit()
        db.refresh(attachment)
    except Exception as e:
        # Rollback: remove the file if DB insert fails
        logger.error(f"DB insert failed after file upload: {e}")
        storage.delete(storage_path)
        db.rollback()
        raise HTTPException(
            status_code=500, detail="Upload failed. Please try again."
        )

    return _to_response(attachment)


def list_attachments(db: Session, obligation_id: UUID) -> list[AttachmentResponse]:
    """List all attachments for an obligation."""
    attachments = (
        db.query(Attachment)
        .filter(Attachment.obligation_id == obligation_id)
        .order_by(Attachment.created_at.desc())
        .all()
    )
    return [_to_response(a) for a in attachments]


def get_attachment(db: Session, attachment_id: UUID) -> Optional[Attachment]:
    """Get attachment model by ID (for serving files)."""
    return db.query(Attachment).filter(Attachment.id == attachment_id).first()


def delete_attachment(db: Session, attachment_id: UUID) -> bool:
    """Delete an attachment: remove file from storage and metadata from DB."""
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        return False

    storage_path = attachment.storage_path

    # Delete from database first (more critical for data integrity)
    try:
        db.delete(attachment)
        db.commit()
    except Exception as e:
        logger.error(f"DB delete failed for attachment {attachment_id}: {e}")
        db.rollback()
        return False

    # Delete from storage (best-effort — log failure but don't fail the operation)
    storage = get_storage()
    if not storage.delete(storage_path):
        logger.warning(
            f"Orphaned file in storage: {storage_path} (attachment {attachment_id} deleted from DB)"
        )

    return True


def delete_attachments_for_obligation(db: Session, obligation_id: UUID) -> None:
    """Delete all attachment files for an obligation. Called before obligation deletion."""
    attachments = (
        db.query(Attachment).filter(Attachment.obligation_id == obligation_id).all()
    )
    storage = get_storage()
    for attachment in attachments:
        if not storage.delete(attachment.storage_path):
            logger.warning(f"Failed to delete file: {attachment.storage_path}")
    # DB records will be cascade-deleted with the obligation
