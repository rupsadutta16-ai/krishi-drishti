from fastapi import status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.crop import Crop
from app.models.farm import Farm
from app.models.user import User
from app.schemas.crop import CropCreate, CropUpdate
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
            message="Only farmers can manage crops",
        )


def _verify_farm_ownership(farm_id: int, current_user: User, db: Session) -> Farm:
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
            message="Farm not found or does not belong to you",
        )

    return farm


def _get_own_crop(crop_id: int, current_user: User, db: Session) -> Crop:
    """Fetch a crop that belongs to a farm owned by the current user, or raise 404."""
    crop = db.scalar(
        select(Crop)
        .join(Farm)
        .where(
            Crop.id == crop_id,
            Farm.farmer_id == current_user.id,
        )
    )

    if not crop:
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            message="Crop not found",
        )

    return crop


# ── CRUD ──────────────────────────────────────────────────────────

def create_crop(
    crop_data: CropCreate,
    current_user: User,
    db: Session,
) -> Crop:
    _require_farmer(current_user)
    _verify_farm_ownership(crop_data.farm_id, current_user, db)

    crop = Crop(
        farm_id=crop_data.farm_id,
        crop_type=crop_data.crop_type,
        variety=crop_data.variety,
        sowing_date=crop_data.sowing_date,
        growth_stage=crop_data.growth_stage,
    )

    db.add(crop)
    db.commit()
    db.refresh(crop)

    return crop


def list_crops(
    current_user: User,
    db: Session,
    farm_id: int | None = None,
) -> list[Crop]:
    _require_farmer(current_user)

    stmt = select(Crop).join(Farm).where(Farm.farmer_id == current_user.id)
    if farm_id is not None:
        _verify_farm_ownership(farm_id, current_user, db)
        stmt = stmt.where(Crop.farm_id == farm_id)

    stmt = stmt.order_by(Crop.created_at.desc())
    crops = db.scalars(stmt).all()

    return list(crops)


def get_crop(
    crop_id: int,
    current_user: User,
    db: Session,
) -> Crop:
    _require_farmer(current_user)
    return _get_own_crop(crop_id, current_user, db)


def update_crop(
    crop_id: int,
    crop_data: CropUpdate,
    current_user: User,
    db: Session,
) -> Crop:
    _require_farmer(current_user)
    crop = _get_own_crop(crop_id, current_user, db)

    if crop_data.crop_type is not None:
        crop.crop_type = crop_data.crop_type

    if crop_data.variety is not None:
        crop.variety = crop_data.variety

    if crop_data.sowing_date is not None:
        crop.sowing_date = crop_data.sowing_date

    if crop_data.growth_stage is not None:
        crop.growth_stage = crop_data.growth_stage

    db.commit()
    db.refresh(crop)

    return crop


def delete_crop(
    crop_id: int,
    current_user: User,
    db: Session,
) -> dict:
    _require_farmer(current_user)
    crop = _get_own_crop(crop_id, current_user, db)

    db.delete(crop)
    db.commit()

    return {"message": "Crop deleted successfully"}
