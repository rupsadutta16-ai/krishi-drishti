from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


# ── Overview ──────────────────────────────────────────────────────────────────

class OverviewStats(BaseModel):
    total_cases: int
    open_cases: int
    pending_expert_cases: int
    validated_cases: int
    resolved_cases: int
    closed_cases: int
    total_observations: int
    total_validations: int
    total_farmers: int
    total_experts: int
    high_risk_count: int
    critical_risk_count: int
    disease_cases: int
    pest_cases: int


# ── Case monitoring ───────────────────────────────────────────────────────────

class OfficialCaseRow(BaseModel):
    """Flattened row for the case monitoring table."""
    case_id: int
    title: str
    status: str
    crop_type: Optional[str] = None
    crop_variety: Optional[str] = None
    # Disease or Pest
    case_type: Optional[str] = None          # "Disease" | "Pest" | "Unknown"
    suspected_problem: Optional[str] = None  # predicted_disease or predicted_pest
    risk_level: Optional[str] = None
    confidence: Optional[float] = None
    # Location from farm
    district: Optional[str] = None
    state: Optional[str] = None
    # Timestamps
    created_at: datetime
    latest_observation_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class OfficialCaseListResponse(BaseModel):
    total: int
    cases: List[OfficialCaseRow]


class ObservationDetail(BaseModel):
    id: int
    image_url: str
    status: str
    image_quality_score: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    observed_at: datetime
    predicted_disease: Optional[str] = None
    predicted_pest: Optional[str] = None
    risk_level: Optional[str] = None
    confidence_score: Optional[float] = None
    disease_probability: Optional[float] = None
    pest_probability: Optional[float] = None


class ValidationDetail(BaseModel):
    id: int
    expert_name: Optional[str] = None
    validation_result: str
    corrected_disease: Optional[str] = None
    corrected_pest: Optional[str] = None
    comments: Optional[str] = None
    treatment_recommendation: Optional[str] = None
    created_at: datetime


class OfficialCaseDetail(BaseModel):
    case_id: int
    title: str
    description: Optional[str] = None
    status: str
    farmer_id: int
    farmer_name: Optional[str] = None
    farm_name: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    village: Optional[str] = None
    crop_type: Optional[str] = None
    crop_variety: Optional[str] = None
    growth_stage: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    observations: List[ObservationDetail] = []
    validations: List[ValidationDetail] = []


# ── Step 3: Farmer report / expert validation monitoring ──────────────────────

class AILayer(BaseModel):
    """The original AI prediction — never overwritten."""
    predicted_disease: Optional[str] = None
    predicted_pest: Optional[str] = None
    disease_probability: Optional[float] = None
    pest_probability: Optional[float] = None
    risk_level: Optional[str] = None
    confidence_score: Optional[float] = None
    ai_status: Optional[str] = None


class ExpertLayer(BaseModel):
    """What the expert said about the AI prediction."""
    id: int
    expert_id: int
    expert_name: Optional[str] = None
    validation_result: str            # confirmed | corrected | needs_investigation
    corrected_disease: Optional[str] = None
    corrected_pest: Optional[str] = None
    comments: Optional[str] = None
    treatment_recommendation: Optional[str] = None
    created_at: datetime


class ValidationMonitorRow(BaseModel):
    """
    Represents one validation event with the full three-layer chain:
    AI Prediction → Expert Validation → Expert Advice.
    The original AI prediction is ALWAYS preserved alongside any correction.
    """
    case_id: int
    case_title: str
    case_status: str
    crop_type: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    farmer_name: Optional[str] = None
    case_created_at: datetime
    # Layer 1 – original AI prediction (read-only, never modified)
    ai: Optional[AILayer] = None
    # Layer 2 – expert decision
    expert: ExpertLayer
    # Derived flag for quick filtering
    ai_confirmed: bool     # True if validation_result == 'confirmed'
    ai_corrected: bool     # True if validation_result == 'corrected'
    needs_investigation: bool


class ValidationMonitorStats(BaseModel):
    total_validations: int
    confirmed: int
    corrected: int
    needs_investigation: int
    pending_expert: int         # cases in pending_expert status
    recently_reported: int      # cases reported in last 7 days
    escalated: int              # needs_investigation count


class ValidationMonitorResponse(BaseModel):
    stats: ValidationMonitorStats
    validations: List[ValidationMonitorRow]
    total: int


class OfficialExpertProfileResponse(BaseModel):
    id: int          # user id
    name: str
    username: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    organization: Optional[str] = None
    verification_doc_url: Optional[str] = None
    is_verified: bool
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class VerifyExpertRequest(BaseModel):
    is_verified: bool = True


# ── Step 4: Geographic Hotspot & Risk Area schemas ────────────────────────────

class HotspotPoint(BaseModel):
    case_id: int
    title: str
    crop_type: Optional[str] = None
    case_type: Optional[str] = None
    suspected_problem: Optional[str] = None
    risk_level: Optional[str] = None
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    district: Optional[str] = None
    state: Optional[str] = None
    created_at: datetime


class RiskAreaSummary(BaseModel):
    district: str
    state: str
    total_active_cases: int
    high_risk_cases: int
    critical_risk_cases: int
    total_cases: int
    dominant_problem: Optional[str] = None


class HotspotResponse(BaseModel):
    points: List[HotspotPoint]
    risk_areas: List[RiskAreaSummary]
    total_hotspot_cases: int


# ── Step 5: Agricultural Trend Analysis schemas ──────────────────────────────

class TimeSeriesPoint(BaseModel):
    """A single data point in a time-series chart."""
    date: str              # ISO date string (YYYY-MM-DD)
    total: int = 0
    disease: int = 0
    pest: int = 0
    high: int = 0
    critical: int = 0
    confirmed: int = 0
    corrected: int = 0
    needs_investigation: int = 0


class CategoryCount(BaseModel):
    """A single bar in a category chart."""
    label: str
    count: int


class TrendAnalysisResponse(BaseModel):
    """Complete trend analysis response for the official dashboard."""
    cases_over_time: List[TimeSeriesPoint] = []
    risk_cases_over_time: List[TimeSeriesPoint] = []
    validations_over_time: List[TimeSeriesPoint] = []
    cases_by_crop: List[CategoryCount] = []
    cases_by_district: List[CategoryCount] = []
    total_cases_in_range: int = 0
    total_disease_in_range: int = 0
    total_pest_in_range: int = 0
    total_high_risk_in_range: int = 0
    total_critical_risk_in_range: int = 0
    total_validations_in_range: int = 0


# ── Step 6: Weather Forecast schemas ─────────────────────────────────────────

class WeatherForecastDay(BaseModel):
    """A single day's weather forecast for a location."""
    date: str                          # ISO date string (YYYY-MM-DD)
    source: str                        # "OBSERVED" | "FORECAST"
    location_label: str                # e.g. "Pune, Maharashtra"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    temperature: Optional[float] = None        # Current / predicted temp (°C)
    temperature_min: Optional[float] = None    # Min temp (°C)
    temperature_max: Optional[float] = None    # Max temp (°C)
    humidity: Optional[float] = None           # Relative humidity (%)
    precipitation: Optional[float] = None      # Rainfall (mm)
    wind_speed: Optional[float] = None         # Wind speed (km/h)
    condition: Optional[str] = None            # e.g. "Partly Cloudy"
    weather_risk: Optional[str] = None         # "LOW" | "MODERATE" | "HIGH" | "EXTREME"
    risk_notes: Optional[str] = None           # Human-readable risk explanation
    data_quality: str = "SIMULATED"            # "SIMULATED" | "LIVE_API" | "SENSOR"


class WeatherLocationSummary(BaseModel):
    """Aggregated forecast summary for a district/state."""
    district: Optional[str] = None
    state: Optional[str] = None
    farm_count: int = 0
    avg_temperature: Optional[float] = None
    avg_humidity: Optional[float] = None
    total_precipitation: Optional[float] = None
    overall_risk: Optional[str] = None         # Highest risk across the period
    forecast_days: List[WeatherForecastDay] = []


class WeatherForecastResponse(BaseModel):
    """Complete weather forecast response for the official dashboard."""
    locations: List[WeatherLocationSummary] = []
    forecast_period_days: int = 5
    data_source_note: str = (
        "Weather data is sourced from simulated API and sensor readings. "
        "Forecast values are projections, not confirmed disease or pest outbreaks. "
        "Do not use forecast data as evidence of actual agricultural threats."
    )
    generated_at: Optional[datetime] = None


