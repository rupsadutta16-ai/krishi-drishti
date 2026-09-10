"""
cloudinary_service.py — kept for backwards compatibility.
All logic has been moved to app.utils.media.
"""

from app.utils.media import (  # noqa: F401
    init_cloudinary,
    upload_image,
    upload_document,
    delete_asset,
    delete_image,
)
