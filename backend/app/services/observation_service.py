from datetime import datetime, UTC
from fastapi import status, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.observation import Observation
from app.models.farm import Farm
from app.models.crop import Crop
from app.models.user import User
from app.enums.observation import ObservationStatus
from app.schemas.observation import ObservationCreate, ObservationUpdate
from app.services.cloudinary_service import upload_image
from app.services.image_quality import evaluate_image_bytes
from app.core.exceptions import AppException


def _require_farmer(current_user: User) -> None:
    """Raise 403 if the current user is not a farmer."""
    if current_user.role != "farmer":
        raise AppException(
            status_code=status.HTTP_403_FORBIDDEN,
            message="Only farmers can submit field observations",
        )


def _verify_farm_and_crop(
    farm_id: int,
    crop_id: int,
    current_user: User,
    db: Session,
) -> tuple[Farm, Crop]:
    """Ensure farm belongs to farmer and crop belongs to farm."""
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

    crop = db.scalar(
        select(Crop).where(
            Crop.id == crop_id,
            Crop.farm_id == farm_id,
        )
    )
    if not crop:
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            message="Crop not found on this farm",
        )

    return farm, crop


def _get_own_observation(
    observation_id: int,
    current_user: User,
    db: Session,
) -> Observation:
    """Fetch observation if it belongs to current user (or user is expert/official), or raise 404."""
    stmt = select(Observation).where(Observation.id == observation_id)
    if current_user.role == "farmer":
        stmt = stmt.where(Observation.farmer_id == current_user.id)

    observation = db.scalar(stmt)
    if not observation:
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            message="Observation not found",
        )

    return observation


# ── CRUD ──────────────────────────────────────────────────────────

def create_observation(
    observation_data: ObservationCreate,
    current_user: User,
    db: Session,
) -> Observation:
    _require_farmer(current_user)
    _verify_farm_and_crop(
        observation_data.farm_id, observation_data.crop_id, current_user, db
    )

    observed_at = observation_data.observed_at or datetime.now(UTC)
    quality_score = observation_data.image_quality_score
    if quality_score is not None:
        initial_status = (
            ObservationStatus.READY_FOR_AI
            if quality_score >= 50.0
            else ObservationStatus.IMAGE_REJECTED
        )
    else:
        initial_status = ObservationStatus.READY_FOR_AI

    observation = Observation(
        case_id=None,  # Observation created without case initially
        farmer_id=current_user.id,
        farm_id=observation_data.farm_id,
        crop_id=observation_data.crop_id,
        image_url=observation_data.image_url,
        observed_at=observed_at,
        latitude=observation_data.latitude,
        longitude=observation_data.longitude,
        image_quality_score=quality_score,
        status=initial_status,
    )

    db.add(observation)
    db.commit()
    db.refresh(observation)

    return observation


def create_observation_with_upload(
    farm_id: int,
    crop_id: int,
    file: UploadFile,
    latitude: float | None,
    longitude: float | None,
    current_user: User,
    db: Session,
) -> Observation:
    """Upload image to Cloudinary and evaluate image quality before saving observation."""
    _require_farmer(current_user)
    _verify_farm_and_crop(farm_id, crop_id, current_user, db)

    # Read bytes for OpenCV quality evaluation
    file_bytes = file.file.read()
    file.file.seek(0)

    quality_result = evaluate_image_bytes(file_bytes)

    upload_result = upload_image(file.file, folder="observations")
    image_url = upload_result.get("secure_url") or upload_result.get("url")

    observation = Observation(
        case_id=None,
        farmer_id=current_user.id,
        farm_id=farm_id,
        crop_id=crop_id,
        image_url=image_url,
        observed_at=datetime.now(UTC),
        latitude=latitude,
        longitude=longitude,
        image_quality_score=quality_result.score,
        status=quality_result.status,
    )

    db.add(observation)
    db.commit()
    db.refresh(observation)

    return observation



def list_observations(
    current_user: User,
    db: Session,
    farm_id: int | None = None,
    crop_id: int | None = None,
    status_filter: ObservationStatus | None = None,
) -> list[Observation]:
    stmt = select(Observation)
    if current_user.role == "farmer":
        stmt = stmt.where(Observation.farmer_id == current_user.id)

    if farm_id is not None:
        stmt = stmt.where(Observation.farm_id == farm_id)

    if crop_id is not None:
        stmt = stmt.where(Observation.crop_id == crop_id)

    if status_filter is not None:
        stmt = stmt.where(Observation.status == status_filter)

    stmt = stmt.order_by(Observation.created_at.desc())
    observations = db.scalars(stmt).all()

    return list(observations)


def get_observation(
    observation_id: int,
    current_user: User,
    db: Session,
) -> Observation:
    return _get_own_observation(observation_id, current_user, db)


def update_observation(
    observation_id: int,
    observation_data: ObservationUpdate,
    current_user: User,
    db: Session,
) -> Observation:
    observation = _get_own_observation(observation_id, current_user, db)

    if observation_data.case_id is not None:
        observation.case_id = observation_data.case_id

    if observation_data.status is not None:
        observation.status = observation_data.status

    if observation_data.image_quality_score is not None:
        observation.image_quality_score = observation_data.image_quality_score

    if observation_data.latitude is not None:
        observation.latitude = observation_data.latitude

    if observation_data.longitude is not None:
        observation.longitude = observation_data.longitude

    db.commit()
    db.refresh(observation)

    return observation


def delete_observation(
    observation_id: int,
    current_user: User,
    db: Session,
) -> dict:
    _require_farmer(current_user)
    observation = _get_own_observation(observation_id, current_user, db)

    db.delete(observation)
    db.commit()

    return {"message": "Observation deleted successfully"}
