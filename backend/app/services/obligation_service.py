from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.attachment import Attachment
from app.models.obligation import Obligation
from app.schemas.attachment import AttachmentResponse
from app.schemas.obligation import (
    DashboardResponse,
    ObligationCreate,
    ObligationResponse,
    ObligationUpdate,
)


def compute_status(expiry_date: date, base_status: str) -> str:
    """Compute the display status based on expiry date and stored status."""
    if base_status == "cancelled":
        return "cancelled"
    delta = (expiry_date - date.today()).days
    if delta < 0:
        return "expired"
    if delta <= 7:
        return "urgent"
    if delta <= 30:
        return "expiring_soon"
    return "active"


def days_remaining(expiry_date: date) -> int:
    """Calculate days remaining until expiry. Negative means already expired."""
    return (expiry_date - date.today()).days


def _to_response(obligation: Obligation) -> ObligationResponse:
    """Convert an Obligation model instance to a response schema."""
    attachment_responses = []
    for a in (obligation.attachments or []):
        attachment_responses.append(
            AttachmentResponse(
                id=a.id,
                obligation_id=a.obligation_id,
                original_filename=a.original_filename,
                mime_type=a.mime_type,
                file_size=a.file_size,
                download_url=f"/api/attachments/{a.id}/download",
                is_image=a.mime_type.startswith("image/"),
                created_at=a.created_at,
            )
        )
    return ObligationResponse(
        id=obligation.id,
        title=obligation.title,
        description=obligation.description,
        category=obligation.category,
        provider=obligation.provider,
        purchase_date=obligation.purchase_date,
        expiry_date=obligation.expiry_date,
        amount=obligation.amount,
        currency=obligation.currency,
        status=obligation.status,
        computed_status=compute_status(obligation.expiry_date, obligation.status),
        days_remaining=days_remaining(obligation.expiry_date),
        notes=obligation.notes,
        attachments=attachment_responses,
        created_at=obligation.created_at,
        updated_at=obligation.updated_at,
    )


def list_obligations(
    db: Session,
    search: Optional[str] = None,
    category: Optional[str] = None,
    status_filter: Optional[str] = None,
    sort_by: str = "expiry_date",
) -> list[ObligationResponse]:
    """List obligations with optional filtering, searching, and sorting."""
    query = db.query(Obligation)

    # Search by title or provider
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Obligation.title.ilike(search_term),
                Obligation.provider.ilike(search_term),
            )
        )

    # Filter by category
    if category:
        query = query.filter(Obligation.category == category.lower())

    # Get all matching results
    obligations = query.all()

    # Convert to response objects (with computed status)
    responses = [_to_response(o) for o in obligations]

    # Filter by computed status
    if status_filter:
        sf = status_filter.lower()
        if sf == "active":
            responses = [
                r
                for r in responses
                if r.computed_status in ("active", "expiring_soon", "urgent")
            ]
        elif sf == "expiring_soon":
            responses = [
                r
                for r in responses
                if r.computed_status in ("expiring_soon", "urgent")
            ]
        elif sf == "expired":
            responses = [r for r in responses if r.computed_status == "expired"]
        elif sf == "cancelled":
            responses = [r for r in responses if r.computed_status == "cancelled"]

    # Sort
    if sort_by == "expiry_date":
        responses.sort(key=lambda r: r.expiry_date)
    elif sort_by == "name":
        responses.sort(key=lambda r: r.title.lower())
    elif sort_by == "recently_added":
        responses.sort(key=lambda r: r.created_at, reverse=True)

    return responses


def get_obligation(db: Session, obligation_id: UUID) -> Optional[ObligationResponse]:
    """Get a single obligation by ID."""
    obligation = db.query(Obligation).filter(Obligation.id == obligation_id).first()
    if not obligation:
        return None
    return _to_response(obligation)


def create_obligation(db: Session, data: ObligationCreate) -> ObligationResponse:
    """Create a new obligation."""
    obligation = Obligation(
        title=data.title,
        description=data.description,
        category=data.category,
        provider=data.provider,
        purchase_date=data.purchase_date,
        expiry_date=data.expiry_date,
        amount=data.amount,
        currency=data.currency,
        notes=data.notes,
    )
    db.add(obligation)
    db.commit()
    db.refresh(obligation)
    return _to_response(obligation)


def update_obligation(
    db: Session, obligation_id: UUID, data: ObligationUpdate
) -> Optional[ObligationResponse]:
    """Update an existing obligation."""
    obligation = db.query(Obligation).filter(Obligation.id == obligation_id).first()
    if not obligation:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(obligation, field, value)

    db.commit()
    db.refresh(obligation)
    return _to_response(obligation)


def delete_obligation(db: Session, obligation_id: UUID) -> bool:
    """Delete an obligation and clean up any attached files."""
    obligation = db.query(Obligation).filter(Obligation.id == obligation_id).first()
    if not obligation:
        return False

    # Clean up attached files from storage before DB cascade delete
    from app.services.attachment_service import delete_attachments_for_obligation
    delete_attachments_for_obligation(db, obligation_id)

    db.delete(obligation)
    db.commit()
    return True


def get_dashboard_stats(db: Session) -> DashboardResponse:
    """Calculate dashboard statistics from the database."""
    obligations = db.query(Obligation).all()

    total = len(obligations)
    active = 0
    expiring_soon = 0
    expired = 0

    for o in obligations:
        cs = compute_status(o.expiry_date, o.status)
        if cs == "expired":
            expired += 1
        elif cs in ("expiring_soon", "urgent"):
            expiring_soon += 1
            active += 1  # expiring soon items are still active
        elif cs == "active":
            active += 1
        # cancelled items are not counted in active/expired

    return DashboardResponse(
        total=total,
        active=active,
        expiring_soon=expiring_soon,
        expired=expired,
    )
