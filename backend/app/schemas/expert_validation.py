from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.enums.validation import ValidationResult


class ExpertValidationCreate(BaseModel):
    validation_result: ValidationResult
    corrected_disease: Optional[str] = None
    corrected_pest: Optional[str] = None
    comments: Optional[str] = None
    treatment_recommendation: Optional[str] = None


class ExpertValidationResponse(BaseModel):
    id: int
    case_id: int
    observation_id: Optional[int] = None
    expert_id: int
    validation_result: ValidationResult
    corrected_disease: Optional[str] = None
    corrected_pest: Optional[str] = None
    comments: Optional[str] = None
    treatment_recommendation: Optional[str] = None
    created_at: datetime
    expert_name: Optional[str] = None
    expert_organization: Optional[str] = None

    model_config = {"from_attributes": True}
