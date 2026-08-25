from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.obligation import ObligationCreate, ObligationResponse, ObligationUpdate
from app.services import obligation_service

router = APIRouter(prefix="/api/obligations", tags=["obligations"])


@router.get("", response_model=list[ObligationResponse])
def list_obligations(
    search: Optional[str] = Query(None, description="Search by title or provider"),
    category: Optional[str] = Query(None, description="Filter by category"),
    status: Optional[str] = Query(None, description="Filter by computed status: active, expiring_soon, expired"),
    sort_by: str = Query("expiry_date", description="Sort by: expiry_date, name, recently_added"),
    db: Session = Depends(get_db),
):
    """List all obligations with optional search, filter, and sort."""
    return obligation_service.list_obligations(
        db, search=search, category=category, status_filter=status, sort_by=sort_by
    )


@router.get("/{obligation_id}", response_model=ObligationResponse)
def get_obligation(obligation_id: UUID, db: Session = Depends(get_db)):
    """Get a single obligation by ID."""
    result = obligation_service.get_obligation(db, obligation_id)
    if not result:
        raise HTTPException(status_code=404, detail="Obligation not found")
    return result


@router.post("", response_model=ObligationResponse, status_code=201)
def create_obligation(data: ObligationCreate, db: Session = Depends(get_db)):
    """Create a new obligation."""
    return obligation_service.create_obligation(db, data)


@router.put("/{obligation_id}", response_model=ObligationResponse)
def update_obligation(
    obligation_id: UUID, data: ObligationUpdate, db: Session = Depends(get_db)
):
    """Update an existing obligation."""
    result = obligation_service.update_obligation(db, obligation_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Obligation not found")
    return result


@router.delete("/{obligation_id}", status_code=204)
def delete_obligation(obligation_id: UUID, db: Session = Depends(get_db)):
    """Delete an obligation."""
    success = obligation_service.delete_obligation(db, obligation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Obligation not found")
    return None
