import random
from datetime import datetime, UTC
from sqlalchemy.orm import Session

from app.models.sensor_observation import SensorObservation


def generate_simulated_sensor_data() -> dict[str, float]:
    """
    Generates simulated temperature and humidity telemetry readings for IoT sensor prototype.
    Supports ONLY temperature (°C) and humidity (%).
    Does NOT support soil moisture or pH.
    """
    temperature = round(random.uniform(25.0, 31.5), 1)
    humidity = round(random.uniform(66.0, 78.0), 1)
    return {
        "temperature": temperature,
        "humidity": humidity,
    }


def record_sensor_observation(
    db: Session,
    observation_id: int,
    temperature: float | None = None,
    humidity: float | None = None,
) -> SensorObservation:
    """
    Creates and persists a SensorObservation record associated with an Observation.
    If temperature or humidity are omitted, uses simulated values.
    """
    if temperature is None or humidity is None:
        simulated = generate_simulated_sensor_data()
        temperature = temperature if temperature is not None else simulated["temperature"]
        humidity = humidity if humidity is not None else simulated["humidity"]

    sensor_obs = SensorObservation(
        observation_id=observation_id,
        temperature=temperature,
        humidity=humidity,
        recorded_at=datetime.now(UTC),
    )

    db.add(sensor_obs)
    db.commit()
    db.refresh(sensor_obs)

    return sensor_obs
