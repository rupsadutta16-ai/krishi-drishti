import cv2
import numpy as np
import pytest

from app.enums.observation import ObservationStatus
from app.services.image_quality import (
    evaluate_cv2_image,
    evaluate_image_bytes,
    QualityThresholds,
)


def create_test_image(width=600, height=600, blur=False, dark=False, bright=False, low_res=False):
    """Utility helper to generate synthetic test images for OpenCV evaluation."""
    if low_res:
        width, height = 100, 100

    img = np.zeros((height, width, 3), dtype=np.uint8)

    if dark:
        # Extremely dark image (mean intensity ~10)
        img.fill(10)
    elif bright:
        # Overexposed image (mean intensity ~245)
        img.fill(245)
    else:
        # Normal image with sharp edges (high contrast & texture)
        img.fill(128)
        # Draw high contrast sharp shapes & text
        cv2.rectangle(img, (50, 50), (width - 50, height - 50), (255, 255, 255), -1)
        cv2.circle(img, (width // 2, height // 2), width // 4, (0, 0, 0), -1)
        cv2.putText(img, "LEAF SAMPLE", (60, height // 2), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3)

    if blur:
        # Apply severe Gaussian blur
        img = cv2.GaussianBlur(img, (55, 55), 0)

    return img


def test_high_quality_sharp_image():
    img = create_test_image(width=800, height=600, blur=False)
    result = evaluate_cv2_image(img)

    assert result.is_acceptable is True
    assert result.status == ObservationStatus.READY_FOR_AI
    assert result.score >= 70.0
    assert result.quality_level in ("HIGH", "MEDIUM")
    assert "High quality" in result.message or "accepted" in result.message


def test_blurry_image_rejection():
    img = create_test_image(width=800, height=600, blur=True)
    result = evaluate_cv2_image(img)

    assert result.is_acceptable is False
    assert result.status == ObservationStatus.IMAGE_REJECTED
    assert result.score < 50.0
    assert "blurry" in result.message.lower()


def test_low_resolution_rejection():
    img = create_test_image(width=100, height=100, low_res=True)
    result = evaluate_cv2_image(img)

    assert result.is_acceptable is False
    assert result.status == ObservationStatus.IMAGE_REJECTED
    assert "resolution" in result.message.lower()


def test_dark_image_rejection():
    img = create_test_image(width=600, height=600, dark=True)
    result = evaluate_cv2_image(img)

    assert result.is_acceptable is False
    assert result.status == ObservationStatus.IMAGE_REJECTED
    assert "lighting" in result.message.lower() or "dark" in result.message.lower()


def test_image_bytes_evaluation():
    img = create_test_image(width=800, height=600)
    _, buffer = cv2.imencode('.jpg', img)
    image_bytes = buffer.tobytes()

    result = evaluate_image_bytes(image_bytes)

    assert result.is_acceptable is True
    assert result.status == ObservationStatus.READY_FOR_AI
    assert result.score > 60.0
    assert "width" in result.details
    assert result.details["width"] == 800
