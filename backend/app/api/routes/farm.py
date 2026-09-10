from fastapi import APIRouter, status, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.api.dependencies import get_current_user
from app.schemas.farm import FarmCreate, FarmUpdate, FarmResponse
from app.schemas.soil import FarmSoilCreate, FarmSoilResponse
from app.services.farm_service import (
    create_farm,
    list_farms,
    get_farm,
    update_farm,
    delete_farm,
    toggle_farm_sensor,
    get_farm_weather,
    get_farm_soil,
    save_farm_soil,
)

router = APIRouter(prefix="/farmer/farms", tags=["Farms"])


# ── Weather & Soil Endpoints ───────────────────────────────────────

@router.get(
    "/{farm_id}/weather",
    tags=["Expert Portal", "Farms"],
    status_code=status.HTTP_200_OK,
)
def get_farm_weather_route(
    farm_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current weather/environmental context for a farm."""
    return get_farm_weather(farm_id, db)


@router.get(
    "/{farm_id}/soil",
    response_model=FarmSoilResponse,
    tags=["Expert Portal", "Farms"],
    status_code=status.HTTP_200_OK,
)
def get_farm_soil_route(
    farm_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get soil information for a farm.
    Returns 404 if farmer has not entered Soil Health Card data.
    """
    return get_farm_soil(farm_id, db)


@router.post(
    "/{farm_id}/soil",
    response_model=FarmSoilResponse,
    tags=["Farms"],
    status_code=status.HTTP_200_OK,
)
def save_farm_soil_route(
    farm_id: int,
    soil_data: FarmSoilCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Save or update Soil Health Card data for a farm."""
    return save_farm_soil(farm_id, soil_data, current_user, db)


# ── Farm Management CRUD ──────────────────────────────────────────

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


@router.post(
    "/{farm_id}/toggle-sensor",
    response_model=FarmResponse,
    status_code=status.HTTP_200_OK,
)
def toggle_sensor_route(
    farm_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return toggle_farm_sensor(farm_id, current_user, db)


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
