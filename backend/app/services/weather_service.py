from typing import Any
from sqlalchemy.orm import Session

from app.models.farm import Farm
from app.services.sensor_service import generate_simulated_sensor_data, record_sensor_observation


def fetch_weather_api_data(latitude: float = 19.7515, longitude: float = 75.7139) -> dict[str, Any]:
    """
    Fetches/Simulates environmental weather metrics from Weather API.
    """
    return {
        "temperature": 28.5,
        "mean_temperature": 28.5,
        "min_temperature": 22.5,
        "max_temperature": 34.0,
        "humidity": 60.0,
        "relative_humidity": 60.0,
        "precipitation": 2.5,
        "wind_speed": 12.0,
        "condition": "Partly Cloudy",
    }


def get_environmental_context(
    farm: Farm | None,
    latitude: float | None = None,
    longitude: float | None = None,
    observation_id: int | None = None,
    db: Session | None = None,
) -> dict[str, Any]:
    """
    Combines Sensor and Weather API data according to the farm's `has_sensor` status.

    Flow:
    - Check if farm.has_sensor is True.
    - If has_sensor = True:
        * Temperature -> Simulated Sensor
        * Humidity -> Simulated Sensor
        * Other remaining fields (Precipitation, etc.) -> Weather API
        * Record SensorObservation if db and observation_id are provided
    - If has_sensor = False:
        * All fields (Temperature, Humidity, Precipitation) -> Weather API
    """
    lat = latitude or (farm.latitude if farm else 19.7515) or 19.7515
    lng = longitude or (farm.longitude if farm else 75.7139) or 75.7139

    weather_data = fetch_weather_api_data(lat, lng)

    has_sensor = bool(farm and farm.has_sensor)

    if has_sensor:
        sensor_sim = generate_simulated_sensor_data()
        sensor_temp = sensor_sim["temperature"]
        sensor_hum = sensor_sim["humidity"]

        if observation_id is not None and db is not None:
            try:
                record_sensor_observation(
                    db=db,
                    observation_id=observation_id,
                    temperature=sensor_temp,
                    humidity=sensor_hum,
                )
            except Exception as e:
                print(f"Warning: Failed to persist SensorObservation: {e}")

        environmental_context = {
            **weather_data,
            "temperature": sensor_temp,
            "mean_temperature": sensor_temp,
            "humidity": sensor_hum,
            "relative_humidity": sensor_hum,
            "has_sensor": True,
            "temperature_source": "SENSOR",
            "humidity_source": "SENSOR",
            "precipitation_source": "WEATHER_API",
            "other_fields_source": "WEATHER_API",
        }
    else:
        environmental_context = {
            **weather_data,
            "has_sensor": False,
            "temperature_source": "WEATHER_API",
            "humidity_source": "WEATHER_API",
            "precipitation_source": "WEATHER_API",
            "other_fields_source": "WEATHER_API",
        }

    return environmental_context
