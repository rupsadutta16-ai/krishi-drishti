from datetime import date, datetime

from pydantic import BaseModel, Field

from app.enums.crop import CropType, GrowthStage


class CropCreate(BaseModel):
    farm_id: int
    crop_type: CropType = Field(default=CropType.RICE)
    variety: str | None = Field(default=None, max_length=100)
    sowing_date: date | None = Field(default=None)
    growth_stage: GrowthStage | None = Field(default=None)


class CropUpdate(BaseModel):
    crop_type: CropType | None = Field(default=None)
    variety: str | None = Field(default=None, max_length=100)
    sowing_date: date | None = Field(default=None)
    growth_stage: GrowthStage | None = Field(default=None)


class CropResponse(BaseModel):
    id: int
    farm_id: int
    crop_type: CropType
    variety: str | None
    sowing_date: date | None
    growth_stage: GrowthStage | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
