from datetime import datetime

from pydantic import BaseModel, Field, model_validator

from app.enums.locations import IndianState, is_valid_district_for_state


class FarmCreate(BaseModel):
    farm_name: str = Field(min_length=1, max_length=100)
    area_acres: float | None = Field(default=None, gt=0)
    village: str | None = Field(default=None, max_length=100)
    district: str | None = None
    state: IndianState | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    has_sensor: bool = False

    @model_validator(mode="after")
    def validate_district_belongs_to_state(self):
        if self.district is not None:
            if self.state is None:
                raise ValueError(
                    "A state must be selected before choosing a district."
                )
            if not is_valid_district_for_state(self.state.value, self.district):
                raise ValueError(
                    f"'{self.district}' is not a valid district of {self.state.value}."
                )
        return self


class FarmUpdate(BaseModel):
    farm_name: str | None = Field(default=None, min_length=1, max_length=100)
    area_acres: float | None = Field(default=None, gt=0)
    village: str | None = Field(default=None, max_length=100)
    district: str | None = None
    state: IndianState | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    has_sensor: bool | None = None

    @model_validator(mode="after")
    def validate_district_belongs_to_state(self):
        if self.district is not None and self.state is not None:
            if not is_valid_district_for_state(self.state.value, self.district):
                raise ValueError(
                    f"'{self.district}' is not a valid district of {self.state.value}."
                )
        return self


class FarmResponse(BaseModel):
    id: int
    farmer_id: int
    farm_name: str
    area_acres: float | None
    village: str | None
    district: str | None
    state: str | None
    latitude: float | None
    longitude: float | None
    has_sensor: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
