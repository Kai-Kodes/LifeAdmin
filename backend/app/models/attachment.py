import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class Attachment(Base):
    """
    File attachment metadata for an obligation.

    The actual file is stored on the filesystem (or an object store).
    This table stores metadata and a reference to the stored file path.
    """

    __tablename__ = "attachments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    obligation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("obligations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    original_filename = Column(String(255), nullable=False)
    storage_path = Column(String(512), nullable=False, unique=True)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)  # bytes
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    obligation = relationship("Obligation", back_populates="attachments")

    def __repr__(self) -> str:
        return f"<Attachment(id={self.id}, filename='{self.original_filename}')>"
