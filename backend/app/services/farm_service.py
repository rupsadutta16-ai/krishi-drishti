from fastapi import status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.farm import Farm
from app.models.user import User
from app.schemas.farm import FarmCreate, FarmUpdate
from app.core.exception_handlers import AppException


def _require_farmer(current_user: User) -> None:
    """Raise 403 if the current user is not a farmer."""
    if current_user.role != "farmer":
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
    )

    db.add(farm)
    db.commit()
    db.refresh(farm)

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
