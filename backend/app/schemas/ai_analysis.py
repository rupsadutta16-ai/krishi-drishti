from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.enums.ai_analysis import RiskLevel, AIAnalysisStatus
from app.enums.crop import GrowthStage


class AIAnalysisContext(BaseModel):
    """
    Contextual information supplied to AI analysis service.
    """
    crop: dict[str, Any] | str | None = Field(
        default=None,
        description="Crop details or crop name"
    )
    growth_stage: GrowthStage | str | None = Field(
        default=None,
        description="Current crop growth stage"
    )
    weather: dict[str, Any] | None = Field(
        default=None,
        description="Environmental weather metrics (temperature, humidity, rainfall, etc.)"
    )
    previous_observations: list[dict[str, Any]] | None = Field(
        default=None,
        description="Historical observation records for this crop or farm"
    )
    nearby_reports: list[dict[str, Any]] | None = Field(
        default=None,
        description="Nearby pest or disease outbreak reports"
    )
    pest_trap_data: dict[str, Any] | list[dict[str, Any]] | None = Field(
        default=None,
        description="Pest trap counts and species data"
    )
    sensor_data: dict[str, Any] | None = Field(
        default=None,
        description="Field sensor metrics (soil moisture, leaf wetness, etc.)"
    )
    historical_cases: list[dict[str, Any]] | None = Field(
        default=None,
        description="Historical case reports in the area"
    )


class AIAnalysisCreate(BaseModel):
    observation_id: int
    predicted_disease: str | None = None
    predicted_pest: str | None = None
    disease_probability: float | None = Field(default=None, ge=0.0, le=1.0)
    pest_probability: float | None = Field(default=None, ge=0.0, le=1.0)
    risk_level: RiskLevel | None = None
    confidence_score: float | None = Field(default=None, ge=0.0, le=1.0)
    model_version: str = Field(default="v1.0.0", max_length=100)
    status: AIAnalysisStatus = AIAnalysisStatus.PENDING


class AIAnalysisRequest(BaseModel):
    """
    Request model for triggering AI analysis on an observation.
    """
    context: AIAnalysisContext | None = None
    model_version: str | None = Field(default="v1.0.0", max_length=100)


class AIAnalysisResponse(BaseModel):
    id: int
    observation_id: int
    predicted_disease: str | None
    predicted_pest: str | None
    disease_probability: float | None
    pest_probability: float | None
    risk_level: RiskLevel | None
    confidence_score: float | None
    model_version: str
    status: AIAnalysisStatus
    created_at: datetime

    model_config = {"from_attributes": True}
