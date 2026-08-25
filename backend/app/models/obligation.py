import uuid
from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class Obligation(Base):
    """
    A generalized life obligation record.

    Represents warranties, subscriptions, insurance, and other time-sensitive
    obligations that a user needs to track. The 'category' field distinguishes
    the type of obligation.
    """

    __tablename__ = "obligations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False, index=True)
    provider = Column(String(255), nullable=True)
    purchase_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=False, index=True)
    amount = Column(Numeric(12, 2), nullable=True)
    currency = Column(String(3), nullable=False, default="INR")
    status = Column(String(20), nullable=False, default="active", index=True)
    notes = Column(Text, nullable=True)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    attachments = relationship(
        "Attachment", back_populates="obligation", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Obligation(id={self.id}, title='{self.title}', category='{self.category}')>"
