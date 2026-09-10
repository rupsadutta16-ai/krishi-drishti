"""
Media utility layer — Cloudinary upload/delete helpers.
All media operations in the project should go through this module.
"""

import cloudinary
import cloudinary.uploader
import cloudinary.api

from fastapi import status

from app.core.config import settings
from app.core.exceptions import AppException


def init_cloudinary() -> None:
    """Initialize Cloudinary SDK from settings / environment variables."""
    if settings.CLOUDINARY_URL:
        cloudinary.config(cloudinary_url=settings.CLOUDINARY_URL)
    elif (
        settings.CLOUDINARY_CLOUD_NAME
        and settings.CLOUDINARY_API_KEY
        and settings.CLOUDINARY_API_SECRET
    ):
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,
        )


def upload_image(file, folder: str = "krishi_drishti") -> dict:
    """
    Upload an image file to Cloudinary.

    Accepts: UploadFile, file path, bytes, or a file-like stream.
    Returns: dict with url, secure_url, public_id, format, width, height.
    """
    init_cloudinary()
    try:
        response = cloudinary.uploader.upload(
            file,
            folder=folder,
            resource_type="image",
        )
        return {
            "url": response.get("url"),
            "secure_url": response.get("secure_url"),
            "public_id": response.get("public_id"),
            "format": response.get("format"),
            "width": response.get("width"),
            "height": response.get("height"),
        }
    except Exception as exc:
        raise AppException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=f"Cloudinary image upload failed: {exc}",
        ) from exc


def upload_document(file, folder: str = "krishi_drishti/documents") -> dict:
    """
    Upload a document (PDF, DOCX, or image) to Cloudinary.

    Uses resource_type='auto' so Cloudinary handles both raw files and images.
    Returns: dict with url, secure_url, public_id, format.
    """
    init_cloudinary()
    try:
        response = cloudinary.uploader.upload(
            file,
            folder=folder,
            resource_type="auto",
        )
        return {
            "url": response.get("url"),
            "secure_url": response.get("secure_url"),
            "public_id": response.get("public_id"),
            "format": response.get("format"),
        }
    except Exception as exc:
        raise AppException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=f"Cloudinary document upload failed: {exc}",
        ) from exc


def delete_asset(public_id: str, resource_type: str = "image") -> dict:
    """
    Delete any Cloudinary asset by public_id.

    Pass resource_type='raw' for documents, 'image' (default) for images.
    """
    init_cloudinary()
    try:
        response = cloudinary.uploader.destroy(
            public_id,
            resource_type=resource_type,
            invalidate=True,
        )
        return response
    except Exception as exc:
        raise AppException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=f"Cloudinary deletion failed: {exc}",
        ) from exc


# Backwards-compatible alias used by older code
delete_image = delete_asset
