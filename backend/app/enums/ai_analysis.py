"""
AI Analysis enums for risk levels and status.
"""

from enum import Enum


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AIAnalysisStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    LOW_CONFIDENCE = "LOW_CONFIDENCE"
    EXPERT_REVIEW = "EXPERT_REVIEW"
    REJECTED = "REJECTED"
