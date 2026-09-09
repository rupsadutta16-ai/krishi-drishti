from datetime import datetime, UTC
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.models import User, Farm, Crop, Observation, SensorObservation
from app.services.sensor_service import generate_simulated_sensor_data, record_sensor_observation
from app.services.weather_service import get_environmental_context


@pytest.fixture
def db_session():
    """Create in-memory SQLite database for testing."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_sensor_data_simulation():
    """Verify simulated sensor produces temperature and humidity only."""
    simulated = generate_simulated_sensor_data()
    assert "temperature" in simulated
    assert "humidity" in simulated
    assert "soil_moisture" not in simulated
    assert "ph" not in simulated
    assert 25.0 <= simulated["temperature"] <= 32.0
    assert 60.0 <= simulated["humidity"] <= 80.0


def test_sensor_observation_persistence(db_session):
    """Verify SensorObservation record persistence in database."""
    user = User(name="Test Farmer", username="testfarmer", email="farmer@test.com", password_hash="hash", role="farmer")
    db_session.add(user)
    db_session.commit()

    farm = Farm(farmer_id=user.id, farm_name="Sensor Farm", has_sensor=True)
    db_session.add(farm)
    db_session.commit()

    crop = Crop(farm_id=farm.id, crop_type="Wheat")
    db_session.add(crop)
    db_session.commit()

    obs = Observation(farmer_id=user.id, farm_id=farm.id, crop_id=crop.id, image_url="http://test.com/img.jpg")
    db_session.add(obs)
    db_session.commit()

    sensor_record = record_sensor_observation(db=db_session, observation_id=obs.id, temperature=27.5, humidity=72.0)
    assert sensor_record.id is not None
    assert sensor_record.observation_id == obs.id
    assert sensor_record.temperature == 27.5
    assert sensor_record.humidity == 72.0


def test_environmental_context_flow_with_sensor(db_session):
    """Verify environmental context uses simulated sensor when has_sensor=True."""
    user = User(name="Sensor User", username="sensor_user", email="sensor@test.com", password_hash="hash", role="farmer")
    db_session.add(user)
    db_session.commit()

    farm_with_sensor = Farm(farmer_id=user.id, farm_name="Smart Plot", has_sensor=True)
    db_session.add(farm_with_sensor)
    db_session.commit()

    env_context = get_environmental_context(farm=farm_with_sensor, db=db_session)
    assert env_context["has_sensor"] is True
    assert env_context["temperature_source"] == "SENSOR"
    assert env_context["humidity_source"] == "SENSOR"
    assert env_context["precipitation_source"] == "WEATHER_API"


def test_environmental_context_flow_without_sensor(db_session):
    """Verify environmental context uses Weather API when has_sensor=False."""
    user = User(name="NoSensor User", username="nosensor_user", email="nosensor@test.com", password_hash="hash", role="farmer")
    db_session.add(user)
    db_session.commit()

    farm_no_sensor = Farm(farmer_id=user.id, farm_name="Traditional Plot", has_sensor=False)
    db_session.add(farm_no_sensor)
    db_session.commit()

    env_context = get_environmental_context(farm=farm_no_sensor, db=db_session)
    assert env_context["has_sensor"] is False
    assert env_context["temperature_source"] == "WEATHER_API"
    assert env_context["humidity_source"] == "WEATHER_API"
