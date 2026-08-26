import uuid

from sqlalchemy import Column, Date, DateTime, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base


class Document(Base):
    """
    SQLAlchemy model for personal life documents (invoices, contracts, passports, policies, etc.).
    """

    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    storage_path = Column(String(512), nullable=False, unique=True)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)  # size in bytes
    renewal_date = Column(Date, nullable=True)  # optional renewal date
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"<Document(id={self.id}, name='{self.name}', filename='{self.original_filename}')>"
