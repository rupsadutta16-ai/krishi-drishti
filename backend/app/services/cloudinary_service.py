"""
Cloudinary service helper for uploading and deleting media assets.
"""

import cloudinary
import cloudinary.uploader
import cloudinary.api

from app.core.config import settings
from app.core.exceptions import AppException
from fastapi import status


def init_cloudinary() -> None:
    """Initialize Cloudinary SDK configuration from settings/environment."""
    if settings.CLOUDINARY_URL:
        cloudinary.config(cloudinary_url=settings.CLOUDINARY_URL)
    elif settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,
        )


def upload_image(file, folder: str = "krishi_drishti") -> dict:
    """
    Upload an image file (UploadFile object, file path, bytes, or file stream) to Cloudinary.

    Returns:
        dict containing 'url', 'secure_url', 'public_id', 'format', etc.
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
    except Exception as e:
        raise AppException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=f"Cloudinary upload failed: {str(e)}",
        )


def delete_image(public_id: str) -> dict:
    """
    Delete an image from Cloudinary by its public_id.
    """
    init_cloudinary()

    try:
        response = cloudinary.uploader.destroy(public_id, invalidate=True)
        return response
    except Exception as e:
        raise AppException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=f"Cloudinary deletion failed: {str(e)}",
        )
