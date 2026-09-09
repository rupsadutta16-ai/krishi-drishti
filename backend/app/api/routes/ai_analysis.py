import httpx
from typing import Any
from pydantic import BaseModel
from fastapi import APIRouter, status, Depends

from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.api.dependencies import get_current_user
from app.schemas.ai_analysis import (
    AIAnalysisRequest,
    AIAnalysisResponse,
)
from app.services.observation_service import _get_own_observation
from app.services.ai_service import (
    run_ai_analysis,
    run_weather_risk_analysis,
    get_analyses_for_observation,
    get_latest_analysis,
)
from app.core.exceptions import AppException

from app.models.farm import Farm
from app.services.weather_service import get_environmental_context

router = APIRouter(prefix="/farmer", tags=["AI Analysis & Weather Risk"])


class WeatherRiskRequest(BaseModel):
    farm_id: int | None = None
    latitude: float | None = None
    longitude: float | None = None
    crop_type: str | None = None
    mean_temperature: float | None = None
    min_temperature: float | None = None
    max_temperature: float | None = None
    relative_humidity: float | None = None
    precipitation: float | None = None


@router.post(
    "/observations/{observation_id}/analyze",
    response_model=AIAnalysisResponse,
    status_code=status.HTTP_201_CREATED,
)
def request_ai_analysis_route(
    observation_id: int,
    payload: AIAnalysisRequest | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Trigger image/pathology-based AI analysis on an observation with optional contextual data.
    If farm has connected IoT sensor, records sensor telemetry and embeds into environmental context.
    """
    observation = _get_own_observation(observation_id, current_user, db)
    farm = db.scalar(select(Farm).where(Farm.id == observation.farm_id))

    env_context = get_environmental_context(
        farm=farm,
        latitude=observation.latitude,
        longitude=observation.longitude,
        observation_id=observation.id,
        db=db,
    )

    context = payload.context if payload else None
    if context is None:
        from app.schemas.ai_analysis import AIAnalysisContext
        context = AIAnalysisContext(
            crop={"crop_type": observation.crop.crop_type if observation.crop else "Crop"},
            weather=env_context,
        )
    elif not context.weather:
        context.weather = env_context

    model_version = (payload.model_version if payload and payload.model_version else "v1.0.0")

    ai_analysis = run_ai_analysis(
        db=db,
        observation=observation,
        context=context,
        model_version=model_version,
    )
    return ai_analysis


@router.get(
    "/observations/{observation_id}/analyses",
    response_model=list[AIAnalysisResponse],
    status_code=status.HTTP_200_OK,
)
def list_ai_analyses_route(
    observation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve all AI analysis records for an observation (multiple runs supported).
    """
    _get_own_observation(observation_id, current_user, db)
    return get_analyses_for_observation(db, observation_id)


@router.get(
    "/observations/{observation_id}/analyses/latest",
    response_model=AIAnalysisResponse,
    status_code=status.HTTP_200_OK,
)
def get_latest_ai_analysis_route(
    observation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve the most recent AI analysis record for an observation.
    """
    _get_own_observation(observation_id, current_user, db)
    latest = get_latest_analysis(db, observation_id)
    if not latest:
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            message="No AI analysis found for this observation",
        )
    return latest


@router.post(
    "/weather/risk-analysis",
    status_code=status.HTTP_200_OK,
)
def analyze_weather_risk_route(
    payload: WeatherRiskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Evaluates environmental risk analysis for a crop plot.
    If farm has connected IoT sensor (has_sensor=True), temperature and humidity come from simulated sensor,
    while remaining fields (precipitation, etc.) come from Weather API.
    """
    farm = None
    if payload.farm_id:
        farm = db.scalar(select(Farm).where(Farm.id == payload.farm_id, Farm.farmer_id == current_user.id))

    lat = payload.latitude or (farm.latitude if farm else 19.7515) or 19.7515
    lng = payload.longitude or (farm.longitude if farm else 75.7139) or 75.7139

    weather_metrics = get_environmental_context(
        farm=farm,
        latitude=lat,
        longitude=lng,
        db=db,
    )

    # Override direct metrics if explicitly provided in request
    if payload.mean_temperature is not None:
        weather_metrics["mean_temperature"] = payload.mean_temperature
        weather_metrics["temperature"] = payload.mean_temperature
    if payload.relative_humidity is not None:
        weather_metrics["relative_humidity"] = payload.relative_humidity
        weather_metrics["humidity"] = payload.relative_humidity
    if payload.precipitation is not None:
        weather_metrics["precipitation"] = payload.precipitation

    analysis_result = run_weather_risk_analysis(
        weather_data=weather_metrics,
        crop_type=payload.crop_type,
    )
    return analysis_result
