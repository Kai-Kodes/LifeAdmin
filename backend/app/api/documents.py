from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.document import DocumentResponse, DocumentUpdate
from app.services import document_service
from app.services.storage import get_storage

router = APIRouter(tags=["documents"])


@router.post(
    "/api/documents",
    response_model=DocumentResponse,
    status_code=201,
)
async def create_document(
    name: str = Form(..., description="Document display name"),
    renewal_date: Optional[str] = Form(None, description="Optional renewal date (YYYY-MM-DD)"),
    file: UploadFile = File(..., description="PDF or image file (max 10 MB)"),
    db: Session = Depends(get_db),
):
    """Upload a document file with a name and optional renewal date."""
    file_data = await file.read()

    parsed_renewal_date: Optional[date] = None
    if renewal_date and renewal_date.strip():
        try:
            parsed_renewal_date = date.fromisoformat(renewal_date.strip())
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Invalid date format. Use YYYY-MM-DD."
            )

    return document_service.create_document(
        db=db,
        name=name,
        renewal_date=parsed_renewal_date,
        file=file,
        file_data=file_data,
    )


@router.get("/api/documents", response_model=list[DocumentResponse])
def list_documents(
    search: Optional[str] = None,
    sort_by: str = "created_at",
    db: Session = Depends(get_db),
):
    """List documents with optional search and sort."""
    return document_service.list_documents(db, search=search, sort_by=sort_by)


@router.get("/api/documents/{document_id}", response_model=DocumentResponse)
def get_document(document_id: UUID, db: Session = Depends(get_db)):
    """Get single document metadata."""
    return document_service.get_document_response(db, document_id)


@router.put("/api/documents/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: UUID,
    update_data: DocumentUpdate,
    db: Session = Depends(get_db),
):
    """Update document name or renewal date."""
    return document_service.update_document(db, document_id, update_data)


@router.post("/api/documents/{document_id}/file", response_model=DocumentResponse)
async def replace_document_file(
    document_id: UUID,
    file: UploadFile = File(..., description="Replacement PDF or image file (max 10 MB)"),
    db: Session = Depends(get_db),
):
    """Replace the stored file for an existing document."""
    file_data = await file.read()
    return document_service.replace_document_file(db, document_id, file, file_data)


@router.get("/api/documents/{document_id}/download")
def download_document(document_id: UUID, db: Session = Depends(get_db)):
    """Download or stream document file inline."""
    doc = document_service.get_document(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    storage = get_storage()
    if not storage.exists(doc.storage_path):
        raise HTTPException(status_code=404, detail="File not found in storage")

    file_path = storage.get_file_path(doc.storage_path)

    return FileResponse(
        path=file_path,
        media_type=doc.mime_type,
        filename=doc.original_filename,
        headers={
            "Content-Disposition": f'inline; filename="{doc.original_filename}"'
        },
    )


@router.delete("/api/documents/{document_id}", status_code=204)
def delete_document(document_id: UUID, db: Session = Depends(get_db)):
    """Delete a document record and its file."""
    success = document_service.delete_document(db, document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return None
