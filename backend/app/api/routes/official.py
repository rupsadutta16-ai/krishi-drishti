from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import require_role
from app.db.database import get_db
from app.models.user import User
from app.schemas.official_dashboard import (
    HotspotResponse,
    OfficialCaseDetail,
    OfficialCaseListResponse,
    OfficialExpertProfileResponse,
    OverviewStats,
    TrendAnalysisResponse,
    ValidationMonitorResponse,
    VerifyExpertRequest,
    WeatherForecastResponse,
)
from app.services import official_dashboard_service

router = APIRouter(prefix="/official", tags=["official"])


@router.get("/dashboard/overview", response_model=OverviewStats)
def get_dashboard_overview(
    current_user: User = Depends(require_role(["official"])),
    db: Session = Depends(get_db),
):
    """
    Overview statistics for the government official dashboard.
    Restricted to users with role=official.
    """
    return official_dashboard_service.get_overview_stats(db)


@router.get("/dashboard/cases", response_model=OfficialCaseListResponse)
def list_cases(
    status: Optional[str] = Query(None, description="Filter by case status"),
    crop_type: Optional[str] = Query(None, description="Filter by crop type"),
    risk_level: Optional[str] = Query(None, description="Filter by AI risk level (LOW/MEDIUM/HIGH/CRITICAL)"),
    case_type: Optional[str] = Query(None, description="Filter by type: disease or pest"),
    state: Optional[str] = Query(None, description="Filter by state name"),
    district: Optional[str] = Query(None, description="Filter by district name"),
    date_from: Optional[datetime] = Query(None, description="Created on or after (ISO 8601)"),
    date_to: Optional[datetime] = Query(None, description="Created on or before (ISO 8601)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_role(["official"])),
    db: Session = Depends(get_db),
):
    """
    Filterable, paginated list of all agricultural cases.
    Official-only — no farmer ownership filter applied.
    """
    return official_dashboard_service.list_cases_for_official(
        db,
        status=status,
        crop_type=crop_type,
        risk_level=risk_level,
        case_type=case_type,
        state=state,
        district=district,
        date_from=date_from,
        date_to=date_to,
        skip=skip,
        limit=limit,
    )


@router.get("/dashboard/cases/{case_id}", response_model=OfficialCaseDetail)
def get_case_detail(
    case_id: int,
    current_user: User = Depends(require_role(["official"])),
    db: Session = Depends(get_db),
):
    """
    Full read-only case detail for officials.
    Does NOT check farmer ownership — officials can view any case.
    """
    return official_dashboard_service.get_case_detail_for_official(case_id, db)


@router.get("/dashboard/validations", response_model=ValidationMonitorResponse)
def get_validation_monitoring(
    validation_result: Optional[str] = Query(
        None,
        description="Filter by result: confirmed | corrected | needs_investigation",
    ),
    crop_type: Optional[str] = Query(None, description="Filter by crop type"),
    state: Optional[str] = Query(None, description="Filter by state name"),
    district: Optional[str] = Query(None, description="Filter by district name"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_role(["official"])),
    db: Session = Depends(get_db),
):
    """
    Step 3 — Farmer report & expert validation monitoring.

    Returns all expert validations with the three-layer chain:
      AI Prediction (original, never overwritten)
      → Expert Validation (confirmed / corrected / needs_investigation)
      → Expert Advice (treatment_recommendation)

    Also returns global stats: confirmed, corrected, escalated,
    pending expert, recently reported.

    Official-only; read-only.
    """
    return official_dashboard_service.get_validation_monitoring(
        db,
        validation_result=validation_result,
        crop_type=crop_type,
        state=state,
        district=district,
        skip=skip,
        limit=limit,
    )


@router.get("/experts", response_model=list[OfficialExpertProfileResponse])
def list_experts(
    current_user: User = Depends(require_role(["official"])),
    db: Session = Depends(get_db),
):
    """
    List all experts profiles for official monitoring and verification.
    """
    return official_dashboard_service.list_experts_for_official(db)


@router.post("/experts/{expert_id}/verify", response_model=OfficialExpertProfileResponse)
def verify_expert(
    expert_id: int,
    payload: VerifyExpertRequest = VerifyExpertRequest(is_verified=True),
    current_user: User = Depends(require_role(["official"])),
    db: Session = Depends(get_db),
):
    """
    Verify or update verification status of an expert profile.
    """
    return official_dashboard_service.verify_expert(expert_id, payload.is_verified, db)


@router.get("/dashboard/hotspots", response_model=HotspotResponse)
def get_geographic_hotspots(
    case_type: Optional[str] = Query(None, description="Filter by case type: disease | pest"),
    crop_type: Optional[str] = Query(None, description="Filter by crop type"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level: LOW | MEDIUM | HIGH | CRITICAL"),
    state: Optional[str] = Query(None, description="Filter by state"),
    district: Optional[str] = Query(None, description="Filter by district"),
    date_from: Optional[datetime] = Query(None, description="Created on or after"),
    date_to: Optional[datetime] = Query(None, description="Created on or before"),
    current_user: User = Depends(require_role(["official"])),
    db: Session = Depends(get_db),
):
    """
    Step 4 — Geographic Hotspot and Risk Area monitoring.
    Returns real case points and district-level risk summaries.
    """
    return official_dashboard_service.get_geographic_hotspots(
        db,
        case_type=case_type,
        crop_type=crop_type,
        risk_level=risk_level,
        state=state,
        district=district,
        date_from=date_from,
        date_to=date_to,
    )


@router.get("/dashboard/trends", response_model=TrendAnalysisResponse)
def get_trend_analysis(
    period: str = Query("30d", description="Time period: 7d, 30d, 3m, 6m, 1y"),
    current_user: User = Depends(require_role(["official"])),
    db: Session = Depends(get_db),
):
    """
    Step 5 — Agricultural Trend Analysis.
    Returns time-series data for case trends, risk trends, validation trends,
    and category breakdowns (by crop, district) for charting.
    """
    return official_dashboard_service.get_trend_analysis(db, period=period)


@router.get("/dashboard/forecast", response_model=WeatherForecastResponse)
def get_weather_forecast(
    forecast_days: int = Query(5, ge=1, le=14, description="Number of forecast days (1-14)"),
    current_user: User = Depends(require_role(["official"])),
    db: Session = Depends(get_db),
):
    """
    Step 6 — Weather Forecast for Officials.

    Returns weather forecast data for all farm locations grouped by district.
    Clearly distinguishes OBSERVED (today's data) from FORECAST (projected data).

    ⚠️ Weather forecasts are NOT disease/pest outbreak predictions.
    They provide environmental context for agricultural decision-making.
    """
    return official_dashboard_service.get_weather_forecast(
        db,
        forecast_days=forecast_days,
    )


