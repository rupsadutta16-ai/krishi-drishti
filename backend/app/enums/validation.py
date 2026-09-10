from enum import Enum


class ValidationResult(str, Enum):
    CONFIRMED = "confirmed"
    CORRECTED = "corrected"
    NEEDS_INVESTIGATION = "needs_investigation"
