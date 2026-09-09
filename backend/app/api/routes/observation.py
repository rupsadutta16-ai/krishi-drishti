from fastapi import APIRouter, status, Depends, Query, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.api.dependencies import get_current_user
from app.enums.observation import ObservationStatus
from app.schemas.observation import (
    ObservationUpdate,
    ObservationResponse,
)
from app.services.observation_service import (
    create_observation_with_upload,
    list_observations,
    get_observation,
    update_observation,
    delete_observation,
)

router = APIRouter(prefix="/farmer/observations", tags=["Observations"])


@router.post(
    "",
    response_model=ObservationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_observation_route(
    farm_id: int = Form(...),
    crop_id: int = Form(...),
    file: UploadFile = File(...),
    latitude: float | None = Form(None),
    longitude: float | None = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_observation_with_upload(
        farm_id=farm_id,
        crop_id=crop_id,
        file=file,
        latitude=latitude,
        longitude=longitude,
        current_user=current_user,
        db=db,
    )


@router.get(
    "",
    response_model=list[ObservationResponse],
    status_code=status.HTTP_200_OK,
)
def list_observations_route(
    farm_id: int | None = Query(default=None, description="Filter by farm ID"),
    crop_id: int | None = Query(default=None, description="Filter by crop ID"),
    status_filter: ObservationStatus | None = Query(default=None, alias="status", description="Filter by observation status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_observations(
        current_user=current_user,
        db=db,
        farm_id=farm_id,
        crop_id=crop_id,
        status_filter=status_filter,
    )


@router.get(
    "/{observation_id}",
    response_model=ObservationResponse,
    status_code=status.HTTP_200_OK,
)
def get_observation_route(
    observation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_observation(observation_id, current_user, db)


@router.patch(
    "/{observation_id}",
    response_model=ObservationResponse,
    status_code=status.HTTP_200_OK,
)
def update_observation_route(
    observation_id: int,
    observation_data: ObservationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_observation(observation_id, observation_data, current_user, db)


@router.delete(
    "/{observation_id}",
    status_code=status.HTTP_200_OK,
)
def delete_observation_route(
    observation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return delete_observation(observation_id, current_user, db)
