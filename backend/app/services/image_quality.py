"""
Image Quality Evaluation Service using OpenCV.

Evaluates uploaded crop observation images for resolution, sharpness/blur,
brightness, and contrast before passing them to AI disease analysis.
"""

from dataclasses import dataclass, field
import io
import logging
import cv2
import numpy as np

from app.core.config import settings
from app.enums.observation import ObservationStatus

logger = logging.getLogger(__name__)


@dataclass
class QualityThresholds:
    """Configurable image quality parameters and limits."""
    min_width: int = field(default_factory=lambda: getattr(settings, "IMAGE_QUALITY_MIN_WIDTH", 200))
    min_height: int = field(default_factory=lambda: getattr(settings, "IMAGE_QUALITY_MIN_HEIGHT", 200))
    min_pixels: int = 40000  # e.g. 200x200
    optimal_pixels: int = 480000  # e.g. 800x600

    # Blur / Sharpness threshold (Laplacian variance)
    blur_threshold: float = field(default_factory=lambda: getattr(settings, "IMAGE_QUALITY_BLUR_THRESHOLD", 50.0))
    optimal_blur: float = 200.0

    # Brightness threshold (Mean intensity 0-255)
    min_brightness: float = 30.0
    max_brightness: float = 230.0
    optimal_brightness_min: float = 70.0
    optimal_brightness_max: float = 180.0

    # Contrast threshold (Standard deviation of intensity 0-255)
    min_contrast: float = 15.0
    optimal_contrast: float = 45.0

    # Score cutoffs (0-100)
    accept_score_threshold: float = field(default_factory=lambda: getattr(settings, "IMAGE_QUALITY_ACCEPT_SCORE", 50.0))
    high_score_threshold: float = 75.0


@dataclass
class ImageQualityResult:
    """Quality evaluation result container."""
    score: float
    status: ObservationStatus
    quality_level: str  # HIGH, MEDIUM, LOW
    is_acceptable: bool
    message: str
    details: dict


def evaluate_image_bytes(
    image_bytes: bytes,
    thresholds: QualityThresholds | None = None,
) -> ImageQualityResult:
    """
    Evaluate the quality of an image provided as bytes.

    Returns an ImageQualityResult object containing:
    - score: 0.0 to 100.0
    - status: ObservationStatus.READY_FOR_AI or ObservationStatus.IMAGE_REJECTED
    - quality_level: HIGH, MEDIUM, LOW
    - is_acceptable: bool
    - message: Farmer-facing feedback
    - details: Raw computed metrics (resolution, blur, brightness, contrast)
    """
    if not thresholds:
        thresholds = QualityThresholds()

    if not image_bytes:
        return ImageQualityResult(
            score=0.0,
            status=ObservationStatus.IMAGE_REJECTED,
            quality_level="LOW",
            is_acceptable=False,
            message="No image file data was provided. Please upload a valid crop image.",
            details={"error": "Empty file bytes"},
        )

    try:
        # Convert bytes to numpy array for OpenCV decoding
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except Exception as e:
        logger.error(f"Failed to parse image bytes with OpenCV: {e}")
        return ImageQualityResult(
            score=0.0,
            status=ObservationStatus.IMAGE_REJECTED,
            quality_level="LOW",
            is_acceptable=False,
            message="Invalid or corrupted image format. Please capture and upload a clear photo.",
            details={"error": str(e)},
        )

    if img is None:
        return ImageQualityResult(
            score=0.0,
            status=ObservationStatus.IMAGE_REJECTED,
            quality_level="LOW",
            is_acceptable=False,
            message="Unable to decode image. Please ensure the file is a valid JPG, PNG, or WEBP image.",
            details={"error": "cv2.imdecode returned None"},
        )

    return evaluate_cv2_image(img, thresholds=thresholds)


def evaluate_cv2_image(
    img: np.ndarray,
    thresholds: QualityThresholds | None = None,
) -> ImageQualityResult:
    """
    Core quality evaluation algorithm on a decoded OpenCV BGR image matrix.
    """
    if not thresholds:
        thresholds = QualityThresholds()

    height, width = img.shape[:2]
    total_pixels = height * width

    # Convert to grayscale for metric calculations
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 1. Resolution Metric (0 - 25 points)
    if width < thresholds.min_width or height < thresholds.min_height:
        res_score = 0.0
        res_reason = f"Image dimensions ({width}x{height}) are smaller than minimum allowed ({thresholds.min_width}x{thresholds.min_height})."
    else:
        # Scale between min_pixels (0 pts) and optimal_pixels (25 pts)
        res_ratio = min(1.0, max(0.0, (total_pixels - thresholds.min_pixels) / (thresholds.optimal_pixels - thresholds.min_pixels)))
        res_score = 10.0 + (res_ratio * 15.0)  # Base 10 pts if above min dimensions
        res_reason = "Sufficient resolution."

    # 2. Sharpness / Blur Metric (0 - 35 points) using Laplacian Variance
    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    if laplacian_var < thresholds.blur_threshold:
        blur_score = max(0.0, (laplacian_var / thresholds.blur_threshold) * 10.0)
        blur_reason = f"Image is blurry (Laplacian variance {laplacian_var:.1f} < threshold {thresholds.blur_threshold})."
    else:
        # Scale linearly between blur_threshold (15 pts) and optimal_blur (35 pts)
        blur_ratio = min(1.0, max(0.0, (laplacian_var - thresholds.blur_threshold) / (thresholds.optimal_blur - thresholds.blur_threshold)))
        blur_score = 15.0 + (blur_ratio * 20.0)
        blur_reason = "Sufficient sharpness."

    # 3. Brightness Metric (0 - 20 points) using Mean Grayscale Intensity
    mean_brightness = float(np.mean(gray))
    if mean_brightness < thresholds.min_brightness:
        brightness_score = 0.0
        brightness_reason = f"Image is too dark (mean brightness {mean_brightness:.1f})."
    elif mean_brightness > thresholds.max_brightness:
        brightness_score = 0.0
        brightness_reason = f"Image is overexposed (mean brightness {mean_brightness:.1f})."
    else:
        # Check optimal range (70 - 180)
        if thresholds.optimal_brightness_min <= mean_brightness <= thresholds.optimal_brightness_max:
            brightness_score = 20.0
        else:
            brightness_score = 10.0
        brightness_reason = "Good illumination."

    # 4. Contrast Metric (0 - 20 points) using Standard Deviation of Grayscale Intensity
    contrast_std = float(np.std(gray))
    if contrast_std < thresholds.min_contrast:
        contrast_score = max(0.0, (contrast_std / thresholds.min_contrast) * 5.0)
        contrast_reason = f"Image contrast is very low (std dev {contrast_std:.1f})."
    else:
        contrast_ratio = min(1.0, contrast_std / thresholds.optimal_contrast)
        contrast_score = 5.0 + (contrast_ratio * 15.0)
        contrast_reason = "Sufficient contrast."

    # Flags for hard failure checks
    is_low_res = width < thresholds.min_width or height < thresholds.min_height
    is_blurry = laplacian_var < thresholds.blur_threshold
    is_bad_lighting = mean_brightness < thresholds.min_brightness or mean_brightness > thresholds.max_brightness
    is_low_contrast = contrast_std < thresholds.min_contrast

    # Calculate preliminary total score (0 - 100)
    raw_score = res_score + blur_score + brightness_score + contrast_score

    # Apply penalty if hard quality flaws exist
    if is_blurry or is_bad_lighting or is_low_contrast or is_low_res:
        total_score = round(min(45.0, raw_score), 2)
    else:
        total_score = round(min(100.0, max(0.0, raw_score)), 2)

    details = {
        "width": width,
        "height": height,
        "total_pixels": total_pixels,
        "resolution_score": round(res_score, 2),
        "blur_laplacian_variance": round(laplacian_var, 2),
        "blur_score": round(blur_score, 2),
        "brightness_mean": round(mean_brightness, 2),
        "brightness_score": round(brightness_score, 2),
        "contrast_std": round(contrast_std, 2),
        "contrast_score": round(contrast_score, 2),
        "reasons": [res_reason, blur_reason, brightness_reason, contrast_reason]
    }

    # Evaluate Final Quality Status & Messaging
    if is_low_res:
        return ImageQualityResult(
            score=total_score,
            status=ObservationStatus.IMAGE_REJECTED,
            quality_level="LOW",
            is_acceptable=False,
            message="Image resolution is too low. Please take a closer, higher resolution photo of the crop leaf.",
            details=details,
        )

    if is_bad_lighting:
        return ImageQualityResult(
            score=total_score,
            status=ObservationStatus.IMAGE_REJECTED,
            quality_level="LOW",
            is_acceptable=False,
            message="The image lighting is poor (too dark or overexposed). Please capture under clear daylight.",
            details=details,
        )

    if is_blurry:
        return ImageQualityResult(
            score=total_score,
            status=ObservationStatus.IMAGE_REJECTED,
            quality_level="LOW",
            is_acceptable=False,
            message="The image is too blurry for accurate disease detection. Please hold the camera steady and re-capture a clearer photo.",
            details=details,
        )

    if is_low_contrast:
        return ImageQualityResult(
            score=total_score,
            status=ObservationStatus.IMAGE_REJECTED,
            quality_level="LOW",
            is_acceptable=False,
            message="The image has poor contrast and visibility. Please re-capture under direct natural lighting.",
            details=details,
        )

    if total_score >= thresholds.high_score_threshold:
        return ImageQualityResult(
            score=total_score,
            status=ObservationStatus.READY_FOR_AI,
            quality_level="HIGH",
            is_acceptable=True,
            message="High quality image accepted. Ready for AI pathogen detection.",
            details=details,
        )

    if total_score >= thresholds.accept_score_threshold:
        return ImageQualityResult(
            score=total_score,
            status=ObservationStatus.READY_FOR_AI,
            quality_level="MEDIUM",
            is_acceptable=True,
            message="Medium quality image accepted. AI confidence score may be adjusted based on image clarity.",
            details=details,
        )

    # Fallback rejection for low score
    return ImageQualityResult(
        score=total_score,
        status=ObservationStatus.IMAGE_REJECTED,
        quality_level="LOW",
        is_acceptable=False,
        message="Image quality is too low for reliable AI analysis. Please capture a clear, well-lit photograph focusing directly on the leaf symptoms.",
        details=details,
    )

