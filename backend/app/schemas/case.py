from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.enums.case import CaseStatus
from app.schemas.expert_validation import ExpertValidationResponse


class ObservationSummary(BaseModel):
    id: int
    observed_at: datetime
    status: str
    image_url: Optional[str] = None
    image_quality_score: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    model_config = {"from_attributes": True}


class FarmBrief(BaseModel):
    id: int
    farm_name: str
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    model_config = {"from_attributes": True}


class CropBrief(BaseModel):
    id: int
    crop_type: str
    variety: Optional[str] = None
    growth_stage: Optional[str] = None

    model_config = {"from_attributes": True}


class AIAnalysisBrief(BaseModel):
    id: int
    predicted_disease: Optional[str] = None
    predicted_pest: Optional[str] = None
    disease_probability: Optional[float] = None
    pest_probability: Optional[float] = None
    risk_level: Optional[str] = None
    confidence_score: Optional[float] = None
    model_version: str = "v1.0.0"
    status: str = "PENDING"

    model_config = {"from_attributes": True}


class CaseCreate(BaseModel):
    farm_id: int
    crop_id: int
    title: str
    description: Optional[str] = None
    initial_observation_id: Optional[int] = None


class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[CaseStatus] = None


class CaseListResponse(BaseModel):
    id: int
    title: str
    status: CaseStatus
    farm_id: int
    crop_id: int
    created_at: datetime
    updated_at: datetime
    observation_count: int = 0

    model_config = {"from_attributes": True}


class CaseResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: CaseStatus
    farmer_id: int
    farmer_name: Optional[str] = None
    farm_id: int
    farm: Optional[FarmBrief] = None
    crop_id: int
    crop: Optional[CropBrief] = None
    created_at: datetime
    updated_at: datetime
    observations: List[ObservationSummary] = []
    validations: List[ExpertValidationResponse] = []

    model_config = {"from_attributes": True}


class SubmitToExpertRequest(BaseModel):
    notes: Optional[str] = None
