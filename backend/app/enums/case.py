from enum import Enum


class CaseStatus(str, Enum):
    OPEN = "open"
    PENDING_EXPERT = "pending_expert"
    VALIDATED = "validated"
    RESOLVED = "resolved"
    CLOSED = "closed"
