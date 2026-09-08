"""
Observation status enum.
"""

from enum import Enum


class ObservationStatus(str, Enum):
    SUBMITTED = "SUBMITTED"
    IMAGE_REJECTED = "IMAGE_REJECTED"
    READY_FOR_AI = "READY_FOR_AI"
    AI_ANALYZED = "AI_ANALYZED"
    PENDING_EXPERT = "PENDING_EXPERT"
    VALIDATED = "VALIDATED"
