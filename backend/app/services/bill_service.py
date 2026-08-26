import logging
from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, UploadFile
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.attachment import Attachment
from app.models.bill import Bill
from app.schemas.attachment import AttachmentResponse
from app.schemas.bill import BillCreate, BillResponse, BillUpdate
from app.services import attachment_service

logger = logging.getLogger(__name__)


def compute_bill_status(is_paid: bool, due_date: date) -> tuple[str, str, Optional[int]]:
    """
    Compute status code, human-readable status label, and days remaining for a bill.

    Returns:
        (computed_status, status_label, days_remaining)
    """
    if is_paid:
        return "paid", "Paid", None

    today = date.today()
    days = (due_date - today).days

    if days < 0:
        abs_days = abs(days)
        label = f"Overdue by {abs_days} day{'s' if abs_days != 1 else ''}"
        return "overdue", label, days
    elif days == 0:
        return "due_today", "Due today", 0
    elif days <= 7:
        return "due_soon", f"Due in {days} day{'s' if days != 1 else ''}", days
    else:
        return "upcoming", f"Due in {days} days", days


def _to_bill_response(bill: Bill) -> BillResponse:
    """Convert Bill model to response schema."""
    computed_status, label, days_remaining = compute_bill_status(
        bill.is_paid, bill.due_date
    )

    attachment_resp = None
    if bill.attachment:
        attachment_resp = AttachmentResponse.from_model(bill.attachment)

    return BillResponse(
        id=bill.id,
        name=bill.name,
        due_date=bill.due_date,
        amount=float(bill.amount) if bill.amount is not None else None,
        currency=bill.currency,
        notes=bill.notes,
        is_paid=bill.is_paid,
        computed_status=computed_status,
        status_label=label,
        days_remaining=days_remaining,
        attachment=attachment_resp,
        created_at=bill.created_at,
        updated_at=bill.updated_at,
    )


def create_bill(
    db: Session,
    bill_data: BillCreate,
    file: Optional[UploadFile] = None,
    file_bytes: Optional[bytes] = None,
) -> BillResponse:
    """Create a bill with optional file attachment."""
    attachment: Optional[Attachment] = None

    if file and file_bytes:
        attachment = attachment_service.save_attachment_file(db, file, file_bytes)

    bill = Bill(
        name=bill_data.name.strip(),
        due_date=bill_data.due_date,
        amount=bill_data.amount,
        currency=bill_data.currency.upper(),
        notes=bill_data.notes.strip() if bill_data.notes else None,
        is_paid=False,
        attachment_id=attachment.id if attachment else None,
    )

    db.add(bill)
    db.commit()
    db.refresh(bill)

    return _to_bill_response(bill)


def list_bills(
    db: Session,
    search: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = "due_date",
) -> list[BillResponse]:
    """List bills with optional search, status filtering, and sorting."""
    query = db.query(Bill)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Bill.name.ilike(term),
                Bill.notes.ilike(term),
            )
        )

    if status == "unpaid":
        query = query.filter(Bill.is_paid == False)
    elif status == "paid":
        query = query.filter(Bill.is_paid == True)
    elif status == "overdue":
        query = query.filter(Bill.is_paid == False, Bill.due_date < date.today())

    if sort_by == "name":
        query = query.order_by(Bill.name.asc())
    elif sort_by == "created_at":
        query = query.order_by(Bill.created_at.desc())
    else:  # 'due_date'
        query = query.order_by(Bill.due_date.asc())

    bills = query.all()
    return [_to_bill_response(b) for b in bills]


def get_bill(db: Session, bill_id: UUID) -> Optional[Bill]:
    """Get raw Bill DB model instance."""
    return db.query(Bill).filter(Bill.id == bill_id).first()


def get_bill_response(db: Session, bill_id: UUID) -> BillResponse:
    """Get single bill response schema."""
    bill = get_bill(db, bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return _to_bill_response(bill)


def update_bill(
    db: Session, bill_id: UUID, update_data: BillUpdate
) -> BillResponse:
    """Update bill metadata."""
    bill = get_bill(db, bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    if update_data.name is not None:
        bill.name = update_data.name.strip()
    if update_data.due_date is not None:
        bill.due_date = update_data.due_date
    if update_data.amount is not None:
        bill.amount = update_data.amount
    if update_data.currency is not None:
        bill.currency = update_data.currency.upper()
    if update_data.notes is not None:
        bill.notes = update_data.notes.strip() if update_data.notes else None
    if update_data.is_paid is not None:
        bill.is_paid = update_data.is_paid

    db.commit()
    db.refresh(bill)
    return _to_bill_response(bill)


def toggle_paid(db: Session, bill_id: UUID) -> BillResponse:
    """Toggle bill paid status."""
    bill = get_bill(db, bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    bill.is_paid = not bill.is_paid
    db.commit()
    db.refresh(bill)
    return _to_bill_response(bill)


def delete_bill(db: Session, bill_id: UUID) -> bool:
    """Delete bill and clean up attached file if any."""
    bill = get_bill(db, bill_id)
    if not bill:
        return False

    attachment_id = bill.attachment_id

    db.delete(bill)
    db.commit()

    if attachment_id:
        attachment_service.delete_attachment(db, attachment_id)

    return True
