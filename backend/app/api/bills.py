from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.bill import BillCreate, BillResponse, BillUpdate
from app.services import bill_service

router = APIRouter(tags=["bills"])


@router.post("/api/bills", response_model=BillResponse, status_code=201)
async def create_bill(
    name: str = Form(..., description="Bill title/name"),
    due_date: str = Form(..., description="Mandatory due date (YYYY-MM-DD)"),
    amount: Optional[float] = Form(None, description="Optional bill amount"),
    currency: str = Form("INR", description="Currency code"),
    notes: Optional[str] = Form(None, description="Optional notes"),
    file: Optional[UploadFile] = File(None, description="Optional bill photo or PDF attachment"),
    db: Session = Depends(get_db),
):
    """Create a new bill record with mandatory due date and optional attachment file."""
    try:
        parsed_due_date = date.fromisoformat(due_date.strip())
    except ValueError:
        raise HTTPException(
            status_code=400, detail="Invalid due_date format. Use YYYY-MM-DD."
        )

    file_bytes: Optional[bytes] = None
    if file:
        file_bytes = await file.read()

    bill_data = BillCreate(
        name=name,
        due_date=parsed_due_date,
        amount=amount,
        currency=currency,
        notes=notes,
    )

    return bill_service.create_bill(
        db=db,
        bill_data=bill_data,
        file=file if file_bytes else None,
        file_bytes=file_bytes,
    )


@router.get("/api/bills", response_model=list[BillResponse])
def list_bills(
    search: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = "due_date",
    db: Session = Depends(get_db),
):
    """List bills with optional search, status filtering, and sorting."""
    return bill_service.list_bills(
        db=db, search=search, status=status, sort_by=sort_by
    )


@router.get("/api/bills/{bill_id}", response_model=BillResponse)
def get_bill(bill_id: UUID, db: Session = Depends(get_db)):
    """Get single bill details."""
    return bill_service.get_bill_response(db, bill_id)


@router.put("/api/bills/{bill_id}", response_model=BillResponse)
def update_bill(
    bill_id: UUID, update_data: BillUpdate, db: Session = Depends(get_db)
):
    """Update bill metadata."""
    return bill_service.update_bill(db, bill_id, update_data)


@router.patch("/api/bills/{bill_id}/toggle-paid", response_model=BillResponse)
def toggle_bill_paid(bill_id: UUID, db: Session = Depends(get_db)):
    """Toggle bill paid status."""
    return bill_service.toggle_paid(db, bill_id)


@router.delete("/api/bills/{bill_id}", status_code=204)
def delete_bill(bill_id: UUID, db: Session = Depends(get_db)):
    """Delete a bill record and its attachment."""
    success = bill_service.delete_bill(db, bill_id)
    if not success:
        raise HTTPException(status_code=404, detail="Bill not found")
    return None
