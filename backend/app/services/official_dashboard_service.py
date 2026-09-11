"""
Official Dashboard Service

Aggregates real data from existing models for the government official dashboard.
No fake numbers — all counts come from live database queries.
"""

from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import func, select, and_, or_
from sqlalchemy.orm import Session, joinedload

from app.enums.ai_analysis import RiskLevel
from app.enums.case import CaseStatus
from app.models.agricultural_case import AgriculturalCase
from app.models.ai_analysis import AIAnalysis
from app.models.crop import Crop
from app.models.expert_profile import ExpertProfile
from app.models.expert_validation import ExpertValidation
from app.models.farm import Farm
from app.models.observation import Observation
from app.models.user import User, UserRole
from app.schemas.official_dashboard import (
    AILayer,
    CategoryCount,
    ExpertLayer,
    HotspotPoint,
    HotspotResponse,
    ObservationDetail,
    OfficialCaseDetail,
    OfficialCaseListResponse,
    OfficialCaseRow,
    OfficialExpertProfileResponse,
    OverviewStats,
    RiskAreaSummary,
    TimeSeriesPoint,
    TrendAnalysisResponse,
    ValidationDetail,
    ValidationMonitorResponse,
    ValidationMonitorRow,
    ValidationMonitorStats,
    WeatherForecastDay,
    WeatherForecastResponse,
    WeatherLocationSummary,
)



# ── Helpers ───────────────────────────────────────────────────────────────────

def _str(val) -> Optional[str]:
    """Safely convert enum or string to plain string."""
    if val is None:
        return None
    return val.value if hasattr(val, "value") else str(val)


# ── Overview ──────────────────────────────────────────────────────────────────

def get_overview_stats(db: Session) -> OverviewStats:
    """Return real aggregated counts from the database."""

    def _count_cases(status: CaseStatus) -> int:
        return db.scalar(
            select(func.count(AgriculturalCase.id)).where(
                AgriculturalCase.status == status
            )
        ) or 0

    total_cases = db.scalar(select(func.count(AgriculturalCase.id))) or 0
    open_cases = _count_cases(CaseStatus.OPEN)
    pending_expert_cases = _count_cases(CaseStatus.PENDING_EXPERT)
    validated_cases = _count_cases(CaseStatus.VALIDATED)
    resolved_cases = _count_cases(CaseStatus.RESOLVED)
    closed_cases = _count_cases(CaseStatus.CLOSED)

    total_observations = db.scalar(select(func.count(Observation.id))) or 0
    total_validations = db.scalar(select(func.count(ExpertValidation.id))) or 0

    def _count_users(role: UserRole) -> int:
        return db.scalar(
            select(func.count(User.id)).where(User.role == role)
        ) or 0

    total_farmers = _count_users(UserRole.FARMER)
    total_experts = _count_users(UserRole.EXPERT)

    high_risk_count = db.scalar(
        select(func.count(AIAnalysis.id)).where(
            AIAnalysis.risk_level == RiskLevel.HIGH
        )
    ) or 0

    critical_risk_count = db.scalar(
        select(func.count(AIAnalysis.id)).where(
            AIAnalysis.risk_level == RiskLevel.CRITICAL
        )
    ) or 0

    disease_cases = db.scalar(
        select(func.count(AIAnalysis.id)).where(
            AIAnalysis.predicted_disease.isnot(None),
            AIAnalysis.predicted_disease != "",
        )
    ) or 0

    pest_cases = db.scalar(
        select(func.count(AIAnalysis.id)).where(
            AIAnalysis.predicted_pest.isnot(None),
            AIAnalysis.predicted_pest != "",
        )
    ) or 0

    return OverviewStats(
        total_cases=total_cases,
        open_cases=open_cases,
        pending_expert_cases=pending_expert_cases,
        validated_cases=validated_cases,
        resolved_cases=resolved_cases,
        closed_cases=closed_cases,
        total_observations=total_observations,
        total_validations=total_validations,
        total_farmers=total_farmers,
        total_experts=total_experts,
        high_risk_count=high_risk_count,
        critical_risk_count=critical_risk_count,
        disease_cases=disease_cases,
        pest_cases=pest_cases,
    )


# ── Case monitoring list ──────────────────────────────────────────────────────

def list_cases_for_official(
    db: Session,
    *,
    status: Optional[str] = None,
    crop_type: Optional[str] = None,
    risk_level: Optional[str] = None,
    case_type: Optional[str] = None,   # "disease" | "pest"
    state: Optional[str] = None,
    district: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 50,
) -> OfficialCaseListResponse:
    """
    Return a filterable, paginated list of all cases for government officials.
    Joins Farm, Crop, and the latest AIAnalysis per case to produce a flat row.
    """
    # Build base query with eagerly loaded relationships
    query = (
        db.query(AgriculturalCase)
        .join(Farm, AgriculturalCase.farm_id == Farm.id)
        .join(Crop, AgriculturalCase.crop_id == Crop.id)
        .options(
            joinedload(AgriculturalCase.farm),
            joinedload(AgriculturalCase.crop),
            joinedload(AgriculturalCase.farmer),
            joinedload(AgriculturalCase.observations).joinedload(Observation.ai_analyses),
        )
    )

    # ── Filters ──
    if status:
        query = query.filter(AgriculturalCase.status == status)

    if crop_type:
        query = query.filter(Crop.crop_type == crop_type)

    if state:
        query = query.filter(Farm.state.ilike(f"%{state}%"))

    if district:
        query = query.filter(Farm.district.ilike(f"%{district}%"))

    if date_from:
        query = query.filter(AgriculturalCase.created_at >= date_from)

    if date_to:
        query = query.filter(AgriculturalCase.created_at <= date_to)

    total = query.count()

    cases = (
        query.order_by(AgriculturalCase.updated_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    rows: List[OfficialCaseRow] = []
    for case in cases:
        # Find the latest AI analysis across all observations
        latest_ai: Optional[AIAnalysis] = None
        latest_obs_at: Optional[datetime] = None

        for obs in sorted(case.observations, key=lambda o: o.observed_at, reverse=True):
            if latest_obs_at is None:
                latest_obs_at = obs.observed_at
            if obs.ai_analyses:
                candidate = max(obs.ai_analyses, key=lambda a: a.created_at)
                if latest_ai is None or candidate.created_at > latest_ai.created_at:
                    latest_ai = candidate

        # Derive case_type and suspected_problem from AI analysis
        ct = None
        suspected = None
        rl = None
        conf = None
        if latest_ai:
            rl = _str(latest_ai.risk_level)
            conf = latest_ai.confidence_score
            disease = latest_ai.predicted_disease
            pest = latest_ai.predicted_pest
            if disease:
                ct = "Disease"
                suspected = disease
            elif pest:
                ct = "Pest"
                suspected = pest
            else:
                ct = "Unknown"

        # Apply risk_level filter (post-join since it's from AI analysis)
        if risk_level and rl != risk_level:
            total -= 1
            continue

        # Apply case_type filter
        if case_type:
            if case_type.lower() == "disease" and ct != "Disease":
                total -= 1
                continue
            if case_type.lower() == "pest" and ct != "Pest":
                total -= 1
                continue

        rows.append(OfficialCaseRow(
            case_id=case.id,
            title=case.title,
            status=_str(case.status),
            crop_type=_str(case.crop.crop_type) if case.crop else None,
            crop_variety=case.crop.variety if case.crop else None,
            case_type=ct,
            suspected_problem=suspected,
            risk_level=rl,
            confidence=conf,
            district=case.farm.district if case.farm else None,
            state=case.farm.state if case.farm else None,
            created_at=case.created_at,
            latest_observation_at=latest_obs_at,
        ))

    return OfficialCaseListResponse(total=total, cases=rows)


# ── Case detail ───────────────────────────────────────────────────────────────

def get_case_detail_for_official(
    case_id: int,
    db: Session,
) -> OfficialCaseDetail:
    """Full case detail for an official — read-only, no ownership check."""
    from app.core.exceptions import AppException

    case = (
        db.query(AgriculturalCase)
        .options(
            joinedload(AgriculturalCase.farm),
            joinedload(AgriculturalCase.crop),
            joinedload(AgriculturalCase.farmer),
            joinedload(AgriculturalCase.observations).joinedload(Observation.ai_analyses),
            joinedload(AgriculturalCase.validations).joinedload(ExpertValidation.expert),
        )
        .filter(AgriculturalCase.id == case_id)
        .first()
    )

    if not case:
        raise AppException(status_code=404, message="Case not found")

    # Build observations list with embedded latest AI
    obs_details: List[ObservationDetail] = []
    for obs in sorted(case.observations, key=lambda o: o.observed_at):
        latest_ai = max(obs.ai_analyses, key=lambda a: a.created_at) if obs.ai_analyses else None
        obs_details.append(ObservationDetail(
            id=obs.id,
            image_url=obs.image_url,
            status=_str(obs.status),
            image_quality_score=obs.image_quality_score,
            latitude=obs.latitude,
            longitude=obs.longitude,
            observed_at=obs.observed_at,
            predicted_disease=latest_ai.predicted_disease if latest_ai else None,
            predicted_pest=latest_ai.predicted_pest if latest_ai else None,
            risk_level=_str(latest_ai.risk_level) if latest_ai else None,
            confidence_score=latest_ai.confidence_score if latest_ai else None,
            disease_probability=latest_ai.disease_probability if latest_ai else None,
            pest_probability=latest_ai.pest_probability if latest_ai else None,
        ))

    # Build validations list
    val_details: List[ValidationDetail] = []
    for v in sorted(case.validations, key=lambda x: x.created_at):
        val_details.append(ValidationDetail(
            id=v.id,
            expert_name=v.expert.name if v.expert else None,
            validation_result=_str(v.validation_result),
            corrected_disease=v.corrected_disease,
            corrected_pest=v.corrected_pest,
            comments=v.comments,
            treatment_recommendation=v.treatment_recommendation,
            created_at=v.created_at,
        ))

    return OfficialCaseDetail(
        case_id=case.id,
        title=case.title,
        description=case.description,
        status=_str(case.status),
        farmer_id=case.farmer_id,
        farmer_name=case.farmer.name if case.farmer else None,
        farm_name=case.farm.farm_name if case.farm else None,
        district=case.farm.district if case.farm else None,
        state=case.farm.state if case.farm else None,
        village=case.farm.village if case.farm else None,
        crop_type=_str(case.crop.crop_type) if case.crop else None,
        crop_variety=case.crop.variety if case.crop else None,
        growth_stage=_str(case.crop.growth_stage) if case.crop else None,
        created_at=case.created_at,
        updated_at=case.updated_at,
        observations=obs_details,
        validations=val_details,
    )


# ── Step 3: Farmer report / expert validation monitoring ──────────────────────

def get_validation_monitoring(
    db: Session,
    *,
    validation_result: Optional[str] = None,   # confirmed | corrected | needs_investigation
    crop_type: Optional[str] = None,
    state: Optional[str] = None,
    district: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> ValidationMonitorResponse:
    """
    Returns all expert validations with the three-layer chain preserved:
      Layer 1  –  original AI prediction (never overwritten)
      Layer 2  –  expert decision (confirmed / corrected / needs_investigation)
      Layer 3  –  expert advice (treatment_recommendation)

    Statistics are computed from the full unfiltered dataset first,
    then pagination / filters are applied to the row list.
    """
    from datetime import timedelta
    from app.enums.validation import ValidationResult

    # ── Global stats (no filter) ─────────────────────────────────
    total_v         = db.scalar(select(func.count(ExpertValidation.id))) or 0
    confirmed_c     = db.scalar(select(func.count(ExpertValidation.id)).where(
        ExpertValidation.validation_result == ValidationResult.CONFIRMED)) or 0
    corrected_c     = db.scalar(select(func.count(ExpertValidation.id)).where(
        ExpertValidation.validation_result == ValidationResult.CORRECTED)) or 0
    needs_inv_c     = db.scalar(select(func.count(ExpertValidation.id)).where(
        ExpertValidation.validation_result == ValidationResult.NEEDS_INVESTIGATION)) or 0
    pending_exp_c   = db.scalar(select(func.count(AgriculturalCase.id)).where(
        AgriculturalCase.status == CaseStatus.PENDING_EXPERT)) or 0
    cutoff          = datetime.now(timezone.utc) - timedelta(days=7)
    recently_rep_c  = db.scalar(select(func.count(AgriculturalCase.id)).where(
        AgriculturalCase.created_at >= cutoff)) or 0

    stats = ValidationMonitorStats(
        total_validations=total_v,
        confirmed=confirmed_c,
        corrected=corrected_c,
        needs_investigation=needs_inv_c,
        pending_expert=pending_exp_c,
        recently_reported=recently_rep_c,
        escalated=needs_inv_c,
    )

    # ── Filtered rows ────────────────────────────────────────────
    query = (
        db.query(ExpertValidation)
        .join(AgriculturalCase, ExpertValidation.case_id == AgriculturalCase.id)
        .join(Crop,             AgriculturalCase.crop_id == Crop.id)
        .join(Farm,             AgriculturalCase.farm_id == Farm.id)
        .options(
            joinedload(ExpertValidation.expert),
            joinedload(ExpertValidation.case).joinedload(AgriculturalCase.farmer),
            joinedload(ExpertValidation.case).joinedload(AgriculturalCase.crop),
            joinedload(ExpertValidation.case).joinedload(AgriculturalCase.farm),
            # Load the linked observation + its AI analyses
            joinedload(ExpertValidation.observation).joinedload(Observation.ai_analyses),
        )
    )

    if validation_result:
        query = query.filter(ExpertValidation.validation_result == validation_result)
    if crop_type:
        query = query.filter(Crop.crop_type == crop_type)
    if state:
        query = query.filter(Farm.state.ilike(f"%{state}%"))
    if district:
        query = query.filter(Farm.district.ilike(f"%{district}%"))

    row_total = query.count()
    validations = (
        query
        .order_by(ExpertValidation.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    rows: List[ValidationMonitorRow] = []
    for v in validations:
        case     = v.case
        obs      = v.observation

        # ── Layer 1: original AI prediction (read from the linked observation's AI) ──
        # We NEVER use corrected_disease/corrected_pest for the AI layer —
        # those belong purely to Layer 2.
        ai_layer: Optional[AILayer] = None
        if obs and obs.ai_analyses:
            latest_ai = max(obs.ai_analyses, key=lambda a: a.created_at)
            ai_layer = AILayer(
                predicted_disease=latest_ai.predicted_disease,
                predicted_pest=latest_ai.predicted_pest,
                disease_probability=latest_ai.disease_probability,
                pest_probability=latest_ai.pest_probability,
                risk_level=_str(latest_ai.risk_level),
                confidence_score=latest_ai.confidence_score,
                ai_status=_str(latest_ai.status),
            )

        # ── Layer 2 + 3: expert decision + advice ─────────────────
        vr = _str(v.validation_result)
        expert_layer = ExpertLayer(
            id=v.id,
            expert_id=v.expert_id,
            expert_name=v.expert.name if v.expert else None,
            validation_result=vr,
            corrected_disease=v.corrected_disease,
            corrected_pest=v.corrected_pest,
            comments=v.comments,
            treatment_recommendation=v.treatment_recommendation,
            created_at=v.created_at,
        )

        rows.append(ValidationMonitorRow(
            case_id=case.id if case else 0,
            case_title=case.title if case else "",
            case_status=_str(case.status) if case else "",
            crop_type=_str(case.crop.crop_type) if case and case.crop else None,
            district=case.farm.district if case and case.farm else None,
            state=case.farm.state if case and case.farm else None,
            farmer_name=case.farmer.name if case and case.farmer else None,
            case_created_at=case.created_at if case else v.created_at,
            ai=ai_layer,
            expert=expert_layer,
            ai_confirmed=(vr == "confirmed"),
            ai_corrected=(vr == "corrected"),
            needs_investigation=(vr == "needs_investigation"),
        ))

    return ValidationMonitorResponse(
        stats=stats,
        validations=rows,
        total=row_total,
    )


# ── Step 4: Expert Profiles & Verification for Officials ──────────────────────

def list_experts_for_official(db: Session) -> List[OfficialExpertProfileResponse]:
    """Return all experts with their complete profile, including verification_doc_url and is_verified status."""
    experts = db.scalars(
        select(User).where(User.role == UserRole.EXPERT).order_by(User.created_at.desc())
    ).all()

    result = []
    for u in experts:
        ep = u.expert_profile
        result.append(
            OfficialExpertProfileResponse(
                id=u.id,
                name=u.name,
                username=u.username,
                email=u.email,
                phone=ep.phone if ep else None,
                address=ep.address if ep else None,
                specialization=ep.specialization if ep else None,
                qualification=ep.qualification if ep else None,
                organization=ep.organization if ep else None,
                verification_doc_url=ep.verification_doc_url if ep else None,
                is_verified=ep.is_verified if ep else False,
                created_at=u.created_at,
            )
        )
    return result


def verify_expert(expert_id: int, is_verified: bool, db: Session) -> OfficialExpertProfileResponse:
    """Verify (or unverify) an expert by user_id."""
    from fastapi import HTTPException
    user = db.scalar(select(User).where(User.id == expert_id, User.role == UserRole.EXPERT))
    if not user:
        raise HTTPException(status_code=404, detail="Expert user not found")

    ep = user.expert_profile
    if not ep:
        ep = ExpertProfile(user_id=user.id)
        db.add(ep)

    ep.is_verified = is_verified
    db.commit()
    db.refresh(ep)
    db.refresh(user)

    return OfficialExpertProfileResponse(
        id=user.id,
        name=user.name,
        username=user.username,
        email=user.email,
        phone=ep.phone,
        address=ep.address,
        specialization=ep.specialization,
        qualification=ep.qualification,
        organization=ep.organization,
        verification_doc_url=ep.verification_doc_url,
        is_verified=ep.is_verified,
        created_at=user.created_at,
    )


# ── Step 4: Geographic Hotspot & Risk Area Monitoring ─────────────────────────

def get_geographic_hotspots(
    db: Session,
    case_type: Optional[str] = None,
    crop_type: Optional[str] = None,
    risk_level: Optional[str] = None,
    state: Optional[str] = None,
    district: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
) -> HotspotResponse:
    """
    Step 4 — Geographic Hotspot & Risk Area monitoring.
    Aggregates real case coordinates (from Observation/Farm) and groups by District/State.
    No invented coordinates — uses DB coordinates or district fallback.
    """
    stmt = (
        select(AgriculturalCase)
        .options(
            joinedload(AgriculturalCase.farm),
            joinedload(AgriculturalCase.crop),
            joinedload(AgriculturalCase.observations).joinedload(Observation.ai_analyses),
        )
        .outerjoin(Farm, AgriculturalCase.farm_id == Farm.id)
        .outerjoin(Crop, AgriculturalCase.crop_id == Crop.id)
    )

    conditions = []
    if state:
        conditions.append(Farm.state.ilike(f"%{state}%"))
    if district:
        conditions.append(Farm.district.ilike(f"%{district}%"))
    if crop_type:
        conditions.append(Crop.crop_type.ilike(f"%{crop_type}%"))
    if date_from:
        conditions.append(AgriculturalCase.created_at >= date_from)
    if date_to:
        conditions.append(AgriculturalCase.created_at <= date_to)

    if conditions:
        stmt = stmt.where(and_(*conditions))

    cases = db.scalars(stmt.order_by(AgriculturalCase.created_at.desc())).unique().all()

    points: List[HotspotPoint] = []
    district_data = {}  # key: (district, state) -> dict of counts

    for c in cases:
        # Latest observation for AI prediction / coords
        obs_list = sorted(c.observations or [], key=lambda x: x.observed_at, reverse=True)
        latest_obs = obs_list[0] if obs_list else None

        # Find the latest AI analysis across all observations
        latest_ai: Optional[AIAnalysis] = None
        for obs in (c.observations or []):
            for ai in (obs.ai_analyses or []):
                if latest_ai is None or ai.created_at > latest_ai.created_at:
                    latest_ai = ai

        # Determine suspected problem and case_type from AI analysis
        prob_disease = latest_ai.predicted_disease if latest_ai else None
        prob_pest = latest_ai.predicted_pest if latest_ai else None

        c_type = "Disease" if prob_disease else "Pest" if prob_pest else "Unknown"
        suspected = prob_disease or prob_pest

        # Risk level
        r_level = _str(latest_ai.risk_level) if latest_ai else None

        # Apply filters in Python for derived fields (case_type & risk_level)
        if case_type and c_type.lower() != case_type.lower():
            continue
        if risk_level and (r_level or "LOW").upper() != risk_level.upper():
            continue

        # Extract real coordinates: prefer observation, fallback to farm
        lat = latest_obs.latitude if (latest_obs and latest_obs.latitude is not None) else (c.farm.latitude if c.farm else None)
        lng = latest_obs.longitude if (latest_obs and latest_obs.longitude is not None) else (c.farm.longitude if c.farm else None)

        dist_name = c.farm.district if c.farm and c.farm.district else "Unknown District"
        state_name = c.farm.state if c.farm and c.farm.state else "Unknown State"

        points.append(
            HotspotPoint(
                case_id=c.id,
                title=c.title,
                crop_type=_str(c.crop.crop_type) if c.crop else None,
                case_type=c_type,
                suspected_problem=suspected,
                risk_level=r_level,
                status=_str(c.status),
                latitude=lat,
                longitude=lng,
                district=dist_name,
                state=state_name,
                created_at=c.created_at,
            )
        )

        # Risk Area aggregation (district level)
        key = (dist_name, state_name)
        if key not in district_data:
            district_data[key] = {
                "total_cases": 0,
                "active_cases": 0,
                "high_risk": 0,
                "critical_risk": 0,
                "problems": {},
            }

        d_entry = district_data[key]
        d_entry["total_cases"] += 1

        is_active = c.status in [CaseStatus.OPEN, CaseStatus.PENDING_EXPERT, CaseStatus.VALIDATED]
        if is_active:
            d_entry["active_cases"] += 1

        if (r_level or "LOW").upper() == "HIGH":
            d_entry["high_risk"] += 1
        elif (r_level or "LOW").upper() == "CRITICAL":
            d_entry["critical_risk"] += 1

        if suspected:
            d_entry["problems"][suspected] = d_entry["problems"].get(suspected, 0) + 1

    # Format risk area summaries
    risk_areas: List[RiskAreaSummary] = []
    for (dist, st), d_entry in district_data.items():
        dominant = None
        if d_entry["problems"]:
            dominant = max(d_entry["problems"], key=d_entry["problems"].get)

        risk_areas.append(
            RiskAreaSummary(
                district=dist,
                state=st,
                total_active_cases=d_entry["active_cases"],
                high_risk_cases=d_entry["high_risk"],
                critical_risk_cases=d_entry["critical_risk"],
                total_cases=d_entry["total_cases"],
                dominant_problem=dominant,
            )
        )

    # Sort risk areas by elevated risk activity
    risk_areas.sort(key=lambda x: (x.critical_risk_cases * 3 + x.high_risk_cases * 2 + x.total_active_cases), reverse=True)

    return HotspotResponse(
        points=points,
        risk_areas=risk_areas,
        total_hotspot_cases=len(points),
    )


# ── Step 5: Agricultural Trend Analysis ──────────────────────────────────────

def get_trend_analysis(
    db: Session,
    period: str = "30d",
) -> TrendAnalysisResponse:
    """
    Step 5 — Agricultural Trend Analysis.
    Aggregates real historical data by time period for charting.
    Periods: 7d, 30d, 3m, 6m, 1y
    """
    from datetime import timedelta
    from sqlalchemy import cast, Date

    now = datetime.now(timezone.utc)
    period_map = {
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
        "3m": timedelta(days=90),
        "6m": timedelta(days=180),
        "1y": timedelta(days=365),
    }
    delta = period_map.get(period, timedelta(days=30))
    date_from = now - delta

    # ── 1. Cases over time (total, disease, pest) ──────────────────
    # Join case → observation → ai_analysis to classify disease vs pest per case
    case_query = (
        db.query(AgriculturalCase)
        .options(
            joinedload(AgriculturalCase.observations).joinedload(Observation.ai_analyses),
        )
        .filter(AgriculturalCase.created_at >= date_from)
        .order_by(AgriculturalCase.created_at)
    )
    all_cases = case_query.all()

    # Aggregate by date
    cases_by_date = {}  # date_str -> {total, disease, pest}
    for c in all_cases:
        date_str = c.created_at.strftime("%Y-%m-%d")
        if date_str not in cases_by_date:
            cases_by_date[date_str] = {"total": 0, "disease": 0, "pest": 0}
        cases_by_date[date_str]["total"] += 1

        # Find latest AI analysis to classify
        latest_ai = None
        for obs in (c.observations or []):
            for ai in (obs.ai_analyses or []):
                if latest_ai is None or ai.created_at > latest_ai.created_at:
                    latest_ai = ai

        if latest_ai:
            if latest_ai.predicted_disease:
                cases_by_date[date_str]["disease"] += 1
            elif latest_ai.predicted_pest:
                cases_by_date[date_str]["pest"] += 1

    # Fill in missing dates with zeros
    cases_over_time = []
    current_date = date_from.date()
    end_date = now.date()
    while current_date <= end_date:
        ds = current_date.isoformat()
        entry = cases_by_date.get(ds, {"total": 0, "disease": 0, "pest": 0})
        cases_over_time.append(TimeSeriesPoint(
            date=ds,
            total=entry["total"],
            disease=entry["disease"],
            pest=entry["pest"],
        ))
        current_date += timedelta(days=1)

    # ── 2. Risk cases over time (high, critical) ──────────────────
    risk_by_date = {}  # date_str -> {high, critical}
    for c in all_cases:
        date_str = c.created_at.strftime("%Y-%m-%d")
        if date_str not in risk_by_date:
            risk_by_date[date_str] = {"high": 0, "critical": 0}

        latest_ai = None
        for obs in (c.observations or []):
            for ai in (obs.ai_analyses or []):
                if latest_ai is None or ai.created_at > latest_ai.created_at:
                    latest_ai = ai

        if latest_ai and latest_ai.risk_level:
            rl = _str(latest_ai.risk_level)
            if rl == "HIGH":
                risk_by_date[date_str]["high"] += 1
            elif rl == "CRITICAL":
                risk_by_date[date_str]["critical"] += 1

    risk_cases_over_time = []
    current_date = date_from.date()
    while current_date <= end_date:
        ds = current_date.isoformat()
        entry = risk_by_date.get(ds, {"high": 0, "critical": 0})
        risk_cases_over_time.append(TimeSeriesPoint(
            date=ds,
            high=entry["high"],
            critical=entry["critical"],
        ))
        current_date += timedelta(days=1)

    # ── 3. Validations over time ──────────────────────────────────
    from app.enums.validation import ValidationResult

    val_query = (
        db.query(ExpertValidation)
        .filter(ExpertValidation.created_at >= date_from)
        .order_by(ExpertValidation.created_at)
    )
    all_validations = val_query.all()

    val_by_date = {}  # date_str -> {confirmed, corrected, needs_investigation}
    for v in all_validations:
        date_str = v.created_at.strftime("%Y-%m-%d")
        if date_str not in val_by_date:
            val_by_date[date_str] = {"confirmed": 0, "corrected": 0, "needs_investigation": 0}
        vr = _str(v.validation_result)
        if vr == "confirmed":
            val_by_date[date_str]["confirmed"] += 1
        elif vr == "corrected":
            val_by_date[date_str]["corrected"] += 1
        elif vr == "needs_investigation":
            val_by_date[date_str]["needs_investigation"] += 1

    validations_over_time = []
    current_date = date_from.date()
    while current_date <= end_date:
        ds = current_date.isoformat()
        entry = val_by_date.get(ds, {"confirmed": 0, "corrected": 0, "needs_investigation": 0})
        validations_over_time.append(TimeSeriesPoint(
            date=ds,
            confirmed=entry["confirmed"],
            corrected=entry["corrected"],
            needs_investigation=entry["needs_investigation"],
        ))
        current_date += timedelta(days=1)

    # ── 4. Cases by crop ──────────────────────────────────────────
    crop_counts = (
        db.query(Crop.crop_type, func.count(AgriculturalCase.id))
        .join(AgriculturalCase, AgriculturalCase.crop_id == Crop.id)
        .filter(AgriculturalCase.created_at >= date_from)
        .group_by(Crop.crop_type)
        .order_by(func.count(AgriculturalCase.id).desc())
        .all()
    )
    cases_by_crop = [
        CategoryCount(label=crop_type or "Unknown", count=count)
        for crop_type, count in crop_counts
    ]

    # ── 5. Cases by district ──────────────────────────────────────
    district_counts = (
        db.query(Farm.district, func.count(AgriculturalCase.id))
        .join(AgriculturalCase, AgriculturalCase.farm_id == Farm.id)
        .filter(AgriculturalCase.created_at >= date_from)
        .group_by(Farm.district)
        .order_by(func.count(AgriculturalCase.id).desc())
        .all()
    )
    cases_by_district = [
        CategoryCount(label=district or "Unknown", count=count)
        for district, count in district_counts
    ]

    # ── 6. Summary totals ─────────────────────────────────────────
    total_cases = len(all_cases)
    total_disease = sum(1 for c in all_cases for obs in (c.observations or []) for ai in (obs.ai_analyses or []) if ai.predicted_disease)
    total_pest = sum(1 for c in all_cases for obs in (c.observations or []) for ai in (obs.ai_analyses or []) if ai.predicted_pest)
    total_high = sum(1 for c in all_cases for obs in (c.observations or []) for ai in (obs.ai_analyses or []) if _str(ai.risk_level) == "HIGH")
    total_critical = sum(1 for c in all_cases for obs in (c.observations or []) for ai in (obs.ai_analyses or []) if _str(ai.risk_level) == "CRITICAL")

    return TrendAnalysisResponse(
        cases_over_time=cases_over_time,
        risk_cases_over_time=risk_cases_over_time,
        validations_over_time=validations_over_time,
        cases_by_crop=cases_by_crop,
        cases_by_district=cases_by_district,
        total_cases_in_range=total_cases,
        total_disease_in_range=total_disease,
        total_pest_in_range=total_pest,
        total_high_risk_in_range=total_high,
        total_critical_risk_in_range=total_critical,
        total_validations_in_range=len(all_validations),
    )


# ── Step 6: Weather Forecast ──────────────────────────────────────────────────

def _assess_weather_risk(temp: float, humidity: float, precip: float) -> tuple[str, str]:
    """
    Assess weather-based risk for agricultural conditions.
    Returns (risk_level, risk_notes).
    This is a WEATHER risk assessment, not a disease/pest prediction.
    """
    risk_score = 0
    notes = []

    # Temperature risk
    if temp > 40:
        risk_score += 3
        notes.append(f"Extreme heat ({temp}°C) may stress crops")
    elif temp > 35:
        risk_score += 2
        notes.append(f"High temperature ({temp}°C) may affect crop health")
    elif temp < 5:
        risk_score += 2
        notes.append(f"Low temperature ({temp}°C) may cause frost damage")
    elif temp < 10:
        risk_score += 1
        notes.append(f"Cool temperature ({temp}°C) may slow growth")

    # Humidity risk
    if humidity > 85:
        risk_score += 2
        notes.append(f"High humidity ({humidity}%) may promote fungal growth")
    elif humidity > 75:
        risk_score += 1
        notes.append(f"Elevated humidity ({humidity}%) — monitor for disease")
    elif humidity < 30:
        risk_score += 1
        notes.append(f"Low humidity ({humidity}%) may cause water stress")

    # Precipitation risk
    if precip > 50:
        risk_score += 3
        notes.append(f"Heavy rainfall ({precip}mm) — risk of waterlogging")
    elif precip > 20:
        risk_score += 2
        notes.append(f"Moderate rainfall ({precip}mm) — check drainage")
    elif precip > 10:
        risk_score += 1
        notes.append(f"Light rainfall ({precip}mm)")

    # Map score to risk level
    if risk_score >= 5:
        level = "EXTREME"
    elif risk_score >= 3:
        level = "HIGH"
    elif risk_score >= 1:
        level = "MODERATE"
    else:
        level = "LOW"
        notes.append("Favorable weather conditions for agriculture")

    return level, "; ".join(notes)


def get_weather_forecast(
    db: Session,
    forecast_days: int = 5,
) -> WeatherForecastResponse:
    """
    Step 6 — Weather Forecast for Officials.

    Uses the existing weather_service.fetch_weather_api_data() to retrieve current
    environmental readings for each unique farm location (district-level grouping).

    Generates a multi-day forecast by projecting the current weather data forward.
    This is NOT a disease/pest prediction — it is purely weather information.

    Data sources:
    - Weather API (simulated): temperature, humidity, precipitation, wind, condition
    - Sensor readings: where farms have sensors, sensor data is used for temp/humidity

    The structure is designed so a future ML forecasting model can replace the
    projection logic and provide real multi-day forecasts.
    """
    import random
    from datetime import timedelta
    from app.services.weather_service import fetch_weather_api_data

    # Group farms by district to avoid redundant API calls
    farm_locations = (
        db.query(
            Farm.district,
            Farm.state,
            func.min(Farm.latitude).label("lat"),
            func.min(Farm.longitude).label("lng"),
            func.count(Farm.id).label("farm_count"),
        )
        .filter(Farm.latitude.isnot(None), Farm.longitude.isnot(None))
        .group_by(Farm.district, Farm.state)
        .all()
    )

    locations: List[WeatherLocationSummary] = []
    now = datetime.now(timezone.utc)

    for district, state, lat, lng, farm_count in farm_locations:
        if lat is None or lng is None:
            continue

        # Get current weather from existing service
        current_weather = fetch_weather_api_data(float(lat), float(lng))

        # Generate forecast for each day
        # NOTE: This is a projection of current conditions.
        # A future ML model can replace this with real forecasts.
        forecast_days_list: List[WeatherForecastDay] = []
        base_temp = current_weather.get("temperature", 28.0)
        base_humidity = current_weather.get("humidity", 60.0)
        base_precip = current_weather.get("precipitation", 2.5)
        base_wind = current_weather.get("wind_speed", 12.0)
        base_condition = current_weather.get("condition", "Partly Cloudy")

        for day_offset in range(forecast_days):
            forecast_date = now + timedelta(days=day_offset)
            date_str = forecast_date.strftime("%Y-%m-%d")

            # Project weather with slight daily variation
            # Use a seeded random for reproducibility per location+date
            seed = hash((district, state, date_str)) % 10000
            rng = random.Random(seed)

            if day_offset == 0:
                # Today = current observed data
                temp = base_temp
                temp_min = base_temp - 3
                temp_max = base_temp + 5
                humidity = base_humidity
                precip = base_precip
                wind = base_wind
                condition = base_condition
                source = "OBSERVED"
                data_quality = "SIMULATED"
            else:
                # Future days = projected from current (not confirmed)
                temp = round(base_temp + rng.uniform(-4, 4), 1)
                temp_min = round(temp - rng.uniform(3, 7), 1)
                temp_max = round(temp + rng.uniform(3, 8), 1)
                humidity = round(max(10, min(100, base_humidity + rng.uniform(-15, 15))), 1)
                precip = round(max(0, base_precip + rng.uniform(-5, 10)), 1)
                wind = round(max(0, base_wind + rng.uniform(-8, 8)), 1)
                condition = base_condition  # Simplified — real model would predict this
                source = "FORECAST"
                data_quality = "SIMULATED"

            # Assess weather risk (NOT disease/pest prediction)
            risk_level, risk_notes = _assess_weather_risk(temp, humidity, precip)

            forecast_days_list.append(WeatherForecastDay(
                date=date_str,
                source=source,
                location_label=f"{district}, {state}",
                latitude=float(lat),
                longitude=float(lng),
                temperature=temp,
                temperature_min=temp_min,
                temperature_max=temp_max,
                humidity=humidity,
                precipitation=precip,
                wind_speed=wind,
                condition=condition,
                weather_risk=risk_level,
                risk_notes=risk_notes,
                data_quality=data_quality,
            ))

        # Aggregate location summary
        avg_temp = round(sum(d.temperature or 0 for d in forecast_days_list) / len(forecast_days_list), 1)
        avg_hum = round(sum(d.humidity or 0 for d in forecast_days_list) / len(forecast_days_list), 1)
        total_precip = round(sum(d.precipitation or 0 for d in forecast_days_list), 1)

        # Overall risk = highest risk across all forecast days
        risk_order = {"LOW": 0, "MODERATE": 1, "HIGH": 2, "EXTREME": 3}
        overall_risk = max(
            (d.weather_risk for d in forecast_days_list),
            key=lambda r: risk_order.get(r, 0),
            default="LOW"
        )

        locations.append(WeatherLocationSummary(
            district=district,
            state=state,
            farm_count=farm_count,
            avg_temperature=avg_temp,
            avg_humidity=avg_hum,
            total_precipitation=total_precip,
            overall_risk=overall_risk,
            forecast_days=forecast_days_list,
        ))

    # Sort by overall risk (highest first)
    risk_order = {"LOW": 0, "MODERATE": 1, "HIGH": 2, "EXTREME": 3}
    locations.sort(key=lambda loc: risk_order.get(loc.overall_risk or "LOW", 0), reverse=True)

    return WeatherForecastResponse(
        locations=locations,
        forecast_period_days=forecast_days,
        generated_at=now,
    )


