from datetime import datetime

from pydantic import BaseModel, Field

from app.enums.observation import ObservationStatus


class ObservationCreate(BaseModel):
    farm_id: int
    crop_id: int
    image_url: str = Field(min_length=1, max_length=500)
    observed_at: datetime | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    image_quality_score: float | None = Field(default=None, ge=0.0, le=1.0)


class ObservationUpdate(BaseModel):
    case_id: int | None = None
    status: ObservationStatus | None = None
    image_quality_score: float | None = Field(default=None, ge=0.0, le=1.0)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


class ObservationResponse(BaseModel):
    id: int
    case_id: int | None
    farmer_id: int
    farm_id: int
    crop_id: int
    image_url: str
    observed_at: datetime
    latitude: float | None
    longitude: float | None
    image_quality_score: float | None
    status: ObservationStatus
    created_at: datetime

    model_config = {"from_attributes": True}
