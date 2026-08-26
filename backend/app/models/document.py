import uuid

from sqlalchemy import Column, Date, DateTime, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID

from app.database.base import Base


class Document(Base):
    """
    User-uploaded personal document.

    Stores metadata about important documents (passport, ID cards, certificates, etc.)
    with optional renewal tracking. The actual file is stored via the StorageBackend.
    """

    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    storage_path = Column(String(512), nullable=False, unique=True)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)  # bytes
    renewal_date = Column(Date, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        return f"<Document(id={self.id}, name='{self.name}')>"
