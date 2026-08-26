import uuid

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class Bill(Base):
    """
    SQLAlchemy model for personal utility, service, subscription, and general bills.
    """

    __tablename__ = "bills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    due_date = Column(Date, nullable=False)  # mandatory 'to pay by' date
    amount = Column(Numeric(10, 2), nullable=True)
    currency = Column(String(10), nullable=False, default="INR")
    notes = Column(Text, nullable=True)
    is_paid = Column(Boolean, nullable=False, default=False)

    attachment_id = Column(
        UUID(as_uuid=True),
        ForeignKey("attachments.id", ondelete="SET NULL"),
        nullable=True,
    )
    attachment = relationship("Attachment", lazy="joined")

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"<Bill(id={self.id}, name='{self.name}', due_date={self.due_date}, is_paid={self.is_paid})>"
