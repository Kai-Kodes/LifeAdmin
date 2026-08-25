from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.attachment import AttachmentResponse
from app.services import attachment_service
from app.services.storage import get_storage

router = APIRouter(tags=["attachments"])


@router.post(
    "/api/obligations/{obligation_id}/attachments",
    response_model=AttachmentResponse,
    status_code=201,
)
async def upload_attachment(
    obligation_id: UUID,
    file: UploadFile = File(..., description="PDF or image file (max 10 MB)"),
    db: Session = Depends(get_db),
):
    """Upload a proof-of-purchase attachment for an obligation."""
    # Read file data
    file_data = await file.read()
    return attachment_service.upload_attachment(db, obligation_id, file, file_data)


@router.get(
    "/api/obligations/{obligation_id}/attachments",
    response_model=list[AttachmentResponse],
)
def list_attachments(obligation_id: UUID, db: Session = Depends(get_db)):
    """List all attachments for an obligation."""
    return attachment_service.list_attachments(db, obligation_id)


@router.get("/api/attachments/{attachment_id}/download")
def download_attachment(attachment_id: UUID, db: Session = Depends(get_db)):
    """Download/serve an attachment file."""
    attachment = attachment_service.get_attachment(db, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    storage = get_storage()
    file_path = storage.get_file_path(attachment.storage_path)

    if not storage.exists(attachment.storage_path):
        raise HTTPException(status_code=404, detail="File not found in storage")

    return FileResponse(
        path=file_path,
        media_type=attachment.mime_type,
        filename=attachment.original_filename,
        headers={
            "Content-Disposition": f'inline; filename="{attachment.original_filename}"'
        },
    )


@router.delete("/api/attachments/{attachment_id}", status_code=204)
def delete_attachment(attachment_id: UUID, db: Session = Depends(get_db)):
    """Delete an attachment (file + metadata)."""
    success = attachment_service.delete_attachment(db, attachment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Attachment not found")
    return None
