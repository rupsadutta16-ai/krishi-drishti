from datetime import datetime
from pydantic import BaseModel, ConfigDict, computed_field


class FarmSoilBase(BaseModel):
    sample_no: str | None = None
    test_date: str | None = None

    ph: float | None = None
    ec: float | None = None
    oc: float | None = None
    nitrogen: float | None = None
    phosphorus: float | None = None
    potassium: float | None = None
    sulphur: float | None = None

    zinc: float | None = None
    iron: float | None = None
    copper: float | None = None
    manganese: float | None = None
    boron: float | None = None

    soil_type: str | None = None
    texture: str | None = None
    moisture: float | None = None


class FarmSoilCreate(FarmSoilBase):
    pass


class FarmSoilUpdate(FarmSoilBase):
    pass


class FarmSoilResponse(FarmSoilBase):
    id: int
    farm_id: int
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def organic_carbon(self) -> float | None:
        """Alias for oc to maintain compatibility with Expert Portal."""
        return self.oc

    model_config = ConfigDict(from_attributes=True)
