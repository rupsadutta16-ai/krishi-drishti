from fastapi import APIRouter, status, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.api.dependencies import get_current_user
from app.schemas.crop import CropCreate, CropUpdate, CropResponse
from app.services.crop_service import (
    create_crop,
    list_crops,
    get_crop,
    update_crop,
    delete_crop,
)

router = APIRouter(prefix="/farmer/crops", tags=["Crops"])


@router.post(
    "",
    response_model=CropResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_crop_route(
    crop_data: CropCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_crop(crop_data, current_user, db)


@router.get(
    "",
    response_model=list[CropResponse],
    status_code=status.HTTP_200_OK,
)
def list_crops_route(
    farm_id: int | None = Query(default=None, description="Filter crops by farm ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_crops(current_user, db, farm_id=farm_id)


@router.get(
    "/{crop_id}",
    response_model=CropResponse,
    status_code=status.HTTP_200_OK,
)
def get_crop_route(
    crop_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_crop(crop_id, current_user, db)


@router.patch(
    "/{crop_id}",
    response_model=CropResponse,
    status_code=status.HTTP_200_OK,
)
def update_crop_route(
    crop_id: int,
    crop_data: CropUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_crop(crop_id, crop_data, current_user, db)


@router.delete(
    "/{crop_id}",
    status_code=status.HTTP_200_OK,
)
def delete_crop_route(
    crop_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return delete_crop(crop_id, current_user, db)
