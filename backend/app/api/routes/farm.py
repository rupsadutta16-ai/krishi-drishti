from fastapi import APIRouter, status, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.api.dependencies import get_current_user
from app.schemas.farm import FarmCreate, FarmUpdate, FarmResponse
from app.services.farm_service import (
    create_farm,
    list_farms,
    get_farm,
    update_farm,
    delete_farm,
)

router = APIRouter(prefix="/farmer/farms", tags=["Farms"])


@router.post(
    "",
    response_model=FarmResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_farm_route(
    farm_data: FarmCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_farm(farm_data, current_user, db)


@router.get(
    "",
    response_model=list[FarmResponse],
    status_code=status.HTTP_200_OK,
)
def list_farms_route(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_farms(current_user, db)


@router.get(
    "/{farm_id}",
    response_model=FarmResponse,
    status_code=status.HTTP_200_OK,
)
def get_farm_route(
    farm_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_farm(farm_id, current_user, db)


@router.patch(
    "/{farm_id}",
    response_model=FarmResponse,
    status_code=status.HTTP_200_OK,
)
def update_farm_route(
    farm_id: int,
    farm_data: FarmUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_farm(farm_id, farm_data, current_user, db)


@router.delete(
    "/{farm_id}",
    status_code=status.HTTP_200_OK,
)
def delete_farm_route(
    farm_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return delete_farm(farm_id, current_user, db)
