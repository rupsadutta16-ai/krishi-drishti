from fastapi import status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.farm import Farm
from app.models.user import User
from app.models.soil_record import FarmSoilRecord
from app.schemas.farm import FarmCreate, FarmUpdate
from app.schemas.soil import FarmSoilCreate, FarmSoilUpdate
from app.services.weather_service import get_environmental_context
from sqlalchemy.exc import OperationalError, ProgrammingError

from app.core.exceptions import AppException



def _require_farmer(current_user: User) -> None:
    """Raise 403 if the current user is not a farmer."""
    # Get role value as a string - handle both enum and string storage
    if hasattr(current_user.role, "value"):
        role_val = current_user.role.value  # Enum case
    else:
        role_val = str(current_user.role)  # String case from DB
    
    if role_val != "farmer":
        raise AppException(
            status_code=status.HTTP_403_FORBIDDEN,
            message="Only farmers can manage farms",
        )


def _get_own_farm(farm_id: int, current_user: User, db: Session) -> Farm:
    """Fetch a farm that belongs to the current farmer, or raise 404."""
    farm = db.scalar(
        select(Farm).where(
            Farm.id == farm_id,
            Farm.farmer_id == current_user.id,
        )
    )

    if not farm:
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            message="Farm not found",
        )

    return farm


# ── CRUD ──────────────────────────────────────────────────────────

def create_farm(
    farm_data: FarmCreate,
    current_user: User,
    db: Session,
) -> Farm:
    _require_farmer(current_user)

    farm = Farm(
        farmer_id=current_user.id,
        farm_name=farm_data.farm_name,
        area_acres=farm_data.area_acres,
        village=farm_data.village,
        district=farm_data.district,
        state=farm_data.state.value if farm_data.state else None,
        latitude=farm_data.latitude,
        longitude=farm_data.longitude,
        has_sensor=bool(farm_data.has_sensor),
    )

    db.add(farm)
    try:
        db.commit()
        db.refresh(farm)
    except (OperationalError, ProgrammingError) as exc:
        db.rollback()
        raise AppException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=(
                "Farm could not be saved because the database schema is out of date. "
                "Restart the API so missing columns (such as has_sensor) can be added."
            ),
        ) from exc

    return farm


def list_farms(current_user: User, db: Session) -> list[Farm]:
    _require_farmer(current_user)

    farms = db.scalars(
        select(Farm)
        .where(Farm.farmer_id == current_user.id)
        .order_by(Farm.created_at.desc())
    ).all()

    return list(farms)


def get_farm(
    farm_id: int,
    current_user: User,
    db: Session,
) -> Farm:
    _require_farmer(current_user)
    return _get_own_farm(farm_id, current_user, db)


def update_farm(
    farm_id: int,
    farm_data: FarmUpdate,
    current_user: User,
    db: Session,
) -> Farm:
    _require_farmer(current_user)
    farm = _get_own_farm(farm_id, current_user, db)

    if farm_data.farm_name is not None:
        farm.farm_name = farm_data.farm_name

    if farm_data.area_acres is not None:
        farm.area_acres = farm_data.area_acres

    if farm_data.village is not None:
        farm.village = farm_data.village

    if farm_data.state is not None:
        farm.state = farm_data.state.value

    if farm_data.district is not None:
        farm.district = farm_data.district

    if farm_data.latitude is not None:
        farm.latitude = farm_data.latitude

    if farm_data.longitude is not None:
        farm.longitude = farm_data.longitude

    if farm_data.has_sensor is not None:
        farm.has_sensor = farm_data.has_sensor

    db.commit()
    db.refresh(farm)

    return farm


def toggle_farm_sensor(
    farm_id: int,
    current_user: User,
    db: Session,
) -> Farm:
    _require_farmer(current_user)
    farm = _get_own_farm(farm_id, current_user, db)

    farm.has_sensor = not farm.has_sensor

    db.commit()
    db.refresh(farm)

    return farm


def delete_farm(
    farm_id: int,
    current_user: User,
    db: Session,
) -> dict:
    _require_farmer(current_user)
    farm = _get_own_farm(farm_id, current_user, db)

    db.delete(farm)
    db.commit()

    return {"message": "Farm deleted successfully"}


# ── Weather & Soil Context ──────────────────────────────────────────

def get_farm_weather(
    farm_id: int,
    db: Session,
) -> dict:
    """Fetch environmental/weather context for a farm via weather_service."""
    farm = db.scalar(select(Farm).where(Farm.id == farm_id))
    if not farm:
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            message="Farm not found",
        )

    return get_environmental_context(farm=farm, db=db)


def get_farm_soil(
    farm_id: int,
    db: Session,
) -> FarmSoilRecord:
    """
    Get soil health card record for a farm.
    Returns 404 if the farmer has not entered any Soil Health Card data.
    """
    farm = db.scalar(select(Farm).where(Farm.id == farm_id))
    if not farm:
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            message="Farm not found",
        )

    soil_record = db.scalar(
        select(FarmSoilRecord).where(FarmSoilRecord.farm_id == farm_id)
    )
    if not soil_record:
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            message="No Soil Health Card submitted for this farm",
        )

    return soil_record


def save_farm_soil(
    farm_id: int,
    soil_data: FarmSoilCreate,
    current_user: User,
    db: Session,
) -> FarmSoilRecord:
    """
    Persist or update Soil Health Card data for a farm owned by the current farmer.
    """
    _require_farmer(current_user)
    farm = _get_own_farm(farm_id, current_user, db)

    soil_record = db.scalar(
        select(FarmSoilRecord).where(FarmSoilRecord.farm_id == farm.id)
    )

    if not soil_record:
        soil_record = FarmSoilRecord(
            farm_id=farm.id,
            sample_no=soil_data.sample_no,
            test_date=soil_data.test_date,
            ph=soil_data.ph,
            ec=soil_data.ec,
            oc=soil_data.oc,
            nitrogen=soil_data.nitrogen,
            phosphorus=soil_data.phosphorus,
            potassium=soil_data.potassium,
            sulphur=soil_data.sulphur,
            zinc=soil_data.zinc,
            iron=soil_data.iron,
            copper=soil_data.copper,
            manganese=soil_data.manganese,
            boron=soil_data.boron,
            soil_type=soil_data.soil_type,
            texture=soil_data.texture,
            moisture=soil_data.moisture,
        )
        db.add(soil_record)
    else:
        # Update existing record
        for field in [
            "sample_no", "test_date", "ph", "ec", "oc", "nitrogen",
            "phosphorus", "potassium", "sulphur", "zinc", "iron",
            "copper", "manganese", "boron", "soil_type", "texture", "moisture"
        ]:
            val = getattr(soil_data, field, None)
            if val is not None:
                setattr(soil_record, field, val)

    db.commit()
    db.refresh(soil_record)
    return soil_record

