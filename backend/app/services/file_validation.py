"""
Shared file validation utilities.

Used by both attachment_service (warranty proof) and document_service (personal documents).
"""

import logging
import os

from fastapi import HTTPException, UploadFile

logger = logging.getLogger(__name__)

# 10 MB max file size
MAX_FILE_SIZE = 10 * 1024 * 1024

# Allowed MIME types
ALLOWED_MIME_TYPES = {
    # PDF
    "application/pdf",
    # Images
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
    "image/tiff",
    "image/svg+xml",
    "image/heic",
    "image/heif",
}

# Allowed extensions (lowercase)
ALLOWED_EXTENSIONS = {
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".bmp",
    ".tif",
    ".tiff",
    ".svg",
    ".heic",
    ".heif",
}

IMAGE_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
    "image/tiff",
    "image/svg+xml",
    "image/heic",
    "image/heif",
}

# Magic byte signatures for file type verification
MAGIC_BYTES = {
    b"%PDF": "application/pdf",
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"RIFF": "image/webp",  # RIFF....WEBP
    b"GIF87a": "image/gif",
    b"GIF89a": "image/gif",
    b"BM": "image/bmp",
    b"II": "image/tiff",  # Little-endian TIFF
    b"MM": "image/tiff",  # Big-endian TIFF
}


def _get_extension(filename: str) -> str:
    """Get lowercase file extension."""
    _, ext = os.path.splitext(filename)
    return ext.lower()


def _verify_magic_bytes(data: bytes, claimed_mime: str) -> bool:
    """Verify file content matches claimed MIME type using magic bytes."""
    # SVG, HEIC, HEIF are hard to verify with magic bytes — trust the MIME type
    if claimed_mime in ("image/svg+xml", "image/heic", "image/heif"):
        return True

    for magic, mime in MAGIC_BYTES.items():
        if data[: len(magic)] == magic:
            # Special case: RIFF header needs further check for WEBP
            if magic == b"RIFF" and len(data) >= 12:
                if data[8:12] == b"WEBP":
                    return claimed_mime == "image/webp"
                continue
            # TIFF magic bytes match multiple types
            if magic in (b"II", b"MM"):
                return claimed_mime == "image/tiff"
            return True
    return False


def validate_file(file: UploadFile, file_data: bytes) -> None:
    """
    Validate an uploaded file.
    Raises HTTPException on validation failure.
    """
    # Check file size
    if len(file_data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum file size is {MAX_FILE_SIZE // (1024 * 1024)} MB.",
        )

    if len(file_data) == 0:
        raise HTTPException(status_code=400, detail="Empty file.")

    # Check MIME type
    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a PDF or supported image file.",
        )

    # Check extension
    filename = file.filename or "file"
    ext = _get_extension(filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a PDF or supported image file.",
        )

    # Verify magic bytes
    if not _verify_magic_bytes(file_data, content_type):
        logger.warning(
            f"Magic byte mismatch: claimed {content_type}, file={filename}"
        )
        # Don't reject outright — some files may have non-standard headers
        # But log the warning for security monitoring


def is_image_mime(mime_type: str) -> bool:
    """Check if a MIME type is a supported image format."""
    return mime_type in IMAGE_MIME_TYPES
