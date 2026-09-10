import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.security import OAuth2PasswordRequestForm

from app.db.database import Base
from app.models import User, Farm, FarmSoilRecord
from app.schemas.soil import FarmSoilCreate
from app.services.farm_service import get_farm_soil, save_farm_soil, get_farm_weather
from app.services.auth_service import login_user, register_user
from app.schemas.user import UserCreate, UserRole
from app.core.exceptions import AppException


@pytest.fixture
def db_session():
    """Create in-memory SQLite database for testing."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_soil_record_persistence_only_when_entered_by_farmer(db_session):
    """Verify soil information is returned ONLY if the farmer has entered it."""
    farmer = User(name="Farmer Ramesh", username="ramesh", email="ramesh@test.com", password_hash="hash", role=UserRole.FARMER)
    db_session.add(farmer)
    db_session.commit()

    farm = Farm(farmer_id=farmer.id, farm_name="Ramesh North Field")
    db_session.add(farm)
    db_session.commit()

    # 1. Before farmer enters Soil Health Card, get_farm_soil must raise 404 (no fake data)
    with pytest.raises(AppException) as exc_info:
        get_farm_soil(farm_id=farm.id, db=db_session)
    assert exc_info.value.status_code == 404
    assert "No Soil Health Card" in exc_info.value.message

    # 2. Farmer inputs Soil Health Card details from physical card
    soil_in = FarmSoilCreate(
        sample_no="SHC-2026-MH-1001",
        test_date="2026-09-01",
        ph=6.8,
        ec=0.75,
        oc=0.62,
        nitrogen=290.0,
        phosphorus=22.0,
        potassium=215.0,
        sulphur=11.5,
        zinc=0.65,
        iron=5.2,
        copper=0.4,
        manganese=2.9,
        boron=0.55,
        soil_type="Clay Loam",
        texture="Medium",
        moisture=38.0,
    )

    saved_soil = save_farm_soil(farm_id=farm.id, soil_data=soil_in, current_user=farmer, db=db_session)
    assert saved_soil.id is not None
    assert saved_soil.farm_id == farm.id
    assert saved_soil.ph == 6.8
    assert saved_soil.oc == 0.62
    assert saved_soil.nitrogen == 290.0

    # 3. Now get_farm_soil returns the real persisted soil data
    retrieved = get_farm_soil(farm_id=farm.id, db=db_session)
    assert retrieved.sample_no == "SHC-2026-MH-1001"
    assert retrieved.ph == 6.8
    assert retrieved.nitrogen == 290.0
    assert retrieved.soil_type == "Clay Loam"


def test_non_owner_cannot_save_soil_for_another_farm(db_session):
    """Verify a farmer cannot tamper with or submit soil data for another farmer's plot."""
    farmer1 = User(name="Farmer 1", username="f1", email="f1@test.com", password_hash="hash", role=UserRole.FARMER)
    farmer2 = User(name="Farmer 2", username="f2", email="f2@test.com", password_hash="hash", role=UserRole.FARMER)
    db_session.add_all([farmer1, farmer2])
    db_session.commit()

    farm1 = Farm(farmer_id=farmer1.id, farm_name="Plot 1")
    db_session.add(farm1)
    db_session.commit()

    soil_in = FarmSoilCreate(sample_no="SHC-9999", ph=7.2)
    with pytest.raises(AppException) as exc_info:
        save_farm_soil(farm_id=farm1.id, soil_data=soil_in, current_user=farmer2, db=db_session)
    assert exc_info.value.status_code == 404


def test_expert_registration_and_login_role(db_session):
    """Verify registering and logging in as an expert preserves role and returns role in token response."""
    uc = UserCreate(
        name="Dr. Sunita Rao",
        username="drsunita",
        email="sunita@agriexpert.in",
        password="password123",
        role=UserRole.EXPERT,
    )
    new_user = register_user(uc, db_session)
    assert new_user.role == UserRole.EXPERT or new_user.role == "expert"
    assert new_user.expert_profile is not None

    # Test login
    form = OAuth2PasswordRequestForm(
        grant_type="password",
        username="drsunita",
        password="password123",
        scope="",
        client_id=None,
        client_secret=None,
    )
    login_res = login_user(form, db_session)
    assert "access_token" in login_res
    assert login_res.get("role") == "expert"
