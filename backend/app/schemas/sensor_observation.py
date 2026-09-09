from datetime import datetime
from pydantic import BaseModel


class SensorObservationCreate(BaseModel):
    observation_id: int
    temperature: float
    humidity: float


class SensorObservationResponse(BaseModel):
    id: int
    observation_id: int
    temperature: float
    humidity: float
    recorded_at: datetime

    model_config = {"from_attributes": True}
