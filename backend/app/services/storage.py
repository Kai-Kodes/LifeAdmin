import logging
import os
import re
import uuid
from abc import ABC, abstractmethod
from pathlib import Path

logger = logging.getLogger(__name__)

# Default upload directory: backend/uploads/
DEFAULT_UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")


class StorageBackend(ABC):
    """Abstract storage backend — swap implementations for local/S3/Supabase."""

    @abstractmethod
    def save(self, path: str, data: bytes) -> str:
        """Save file data at the given path. Returns the storage path."""
        ...

    @abstractmethod
    def delete(self, path: str) -> bool:
        """Delete a file at the given path. Returns True if deleted."""
        ...

    @abstractmethod
    def get_file_path(self, path: str) -> str:
        """Get the absolute filesystem path for serving the file."""
        ...

    @abstractmethod
    def exists(self, path: str) -> bool:
        """Check if a file exists at the given path."""
        ...


def _sanitize_filename(filename: str) -> str:
    """Create a safe filename by removing directory traversal and special chars."""
    # Take only the basename
    filename = os.path.basename(filename)
    # Replace spaces with hyphens
    filename = filename.replace(" ", "-")
    # Keep only safe characters
    filename = re.sub(r"[^a-zA-Z0-9._-]", "", filename)
    # Remove leading dots (hidden files)
    filename = filename.lstrip(".")
    # Truncate to reasonable length
    if len(filename) > 100:
        name, ext = os.path.splitext(filename)
        filename = name[:96] + ext
    return filename or "file"


def generate_storage_path(obligation_id: str, original_filename: str) -> str:
    """Generate a safe, unique storage path for an uploaded file."""
    safe_name = _sanitize_filename(original_filename)
    unique_prefix = uuid.uuid4().hex[:12]
    return f"attachments/{obligation_id}/{unique_prefix}_{safe_name}"


class LocalStorage(StorageBackend):
    """Store files on the local filesystem under a configurable directory."""

    def __init__(self, base_dir: str | None = None):
        self.base_dir = os.path.abspath(base_dir or DEFAULT_UPLOAD_DIR)
        os.makedirs(self.base_dir, exist_ok=True)
        logger.info(f"LocalStorage initialized at: {self.base_dir}")

    def _full_path(self, path: str) -> str:
        full = os.path.normpath(os.path.join(self.base_dir, path))
        # Prevent directory traversal
        if not full.startswith(self.base_dir):
            raise ValueError("Invalid storage path")
        return full

    def save(self, path: str, data: bytes) -> str:
        full_path = self._full_path(path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "wb") as f:
            f.write(data)
        logger.info(f"Saved file: {path} ({len(data)} bytes)")
        return path

    def delete(self, path: str) -> bool:
        full_path = self._full_path(path)
        try:
            if os.path.exists(full_path):
                os.remove(full_path)
                logger.info(f"Deleted file: {path}")
                # Try to clean up empty parent directories
                parent = os.path.dirname(full_path)
                if parent != self.base_dir and not os.listdir(parent):
                    os.rmdir(parent)
                return True
            else:
                logger.warning(f"File not found for deletion: {path}")
                return False
        except OSError as e:
            logger.error(f"Failed to delete file {path}: {e}")
            return False

    def get_file_path(self, path: str) -> str:
        return self._full_path(path)

    def exists(self, path: str) -> bool:
        return os.path.exists(self._full_path(path))


# Singleton instance
_storage: StorageBackend | None = None


def get_storage() -> StorageBackend:
    """Get the storage backend singleton."""
    global _storage
    if _storage is None:
        upload_dir = os.getenv("UPLOAD_DIR", DEFAULT_UPLOAD_DIR)
        _storage = LocalStorage(upload_dir)
    return _storage
