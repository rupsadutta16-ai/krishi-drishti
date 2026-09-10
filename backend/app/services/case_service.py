from datetime import datetime, timezone
from typing import List, Optional

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.enums.case import CaseStatus
from app.enums.observation import ObservationStatus
from app.models.agricultural_case import AgriculturalCase
from app.models.observation import Observation
from app.models.farm import Farm
from app.models.user import User, UserRole
from app.schemas.case import CaseCreate, CaseListResponse, CaseResponse, CaseUpdate, SubmitToExpertRequest
from app.schemas.ai_analysis import AIAnalysisContext
from app.services.observation_service import create_observation_with_upload
from app.services.ai_service import run_ai_analysis
from app.services.weather_service import get_environmental_context


def _require_farmer(current_user: User) -> User:
    # Get role value as a string - handle both enum and string storage
    if hasattr(current_user.role, "value"):
        role_val = current_user.role.value  # Enum case
    else:
        role_val = str(current_user.role)  # String case from DB
    
    if role_val != "farmer":
        raise AppException(status_code=403, detail="Only farmers can perform this action")
    return current_user


def _get_own_case(case_id: int, farmer: User, db: Session) -> AgriculturalCase:
    case = db.get(AgriculturalCase, case_id)
    if not case or case.farmer_id != farmer.id:
        raise AppException(status_code=404, detail="Case not found")
    return case


def create_case(current_user: User, payload: CaseCreate, db: Session) -> AgriculturalCase:
    farmer = _require_farmer(current_user)

    case = AgriculturalCase(
        farmer_id=farmer.id,
        farm_id=payload.farm_id,
        crop_id=payload.crop_id,
        title=payload.title,
        description=payload.description,
        status=CaseStatus.OPEN,
    )
    db.add(case)
    db.flush()  # get case.id before linking observation

    if payload.initial_observation_id:
        obs = db.get(Observation, payload.initial_observation_id)
        if not obs or obs.farmer_id != farmer.id:
            raise AppException(status_code=404, detail="Observation not found")
        obs.case_id = case.id
        db.add(obs)

    db.commit()
    db.refresh(case)
    return case


def get_or_create_case_for_observation(
    current_user: User, observation_id: int, db: Session
) -> AgriculturalCase:
    """
    If the observation already belongs to a case, return that case.
    Otherwise, auto-create a case for it using the observation's farm and crop.
    """
    farmer = _require_farmer(current_user)
    obs = db.get(Observation, observation_id)
    if not obs or obs.farmer_id != farmer.id:
        raise AppException(status_code=404, detail="Observation not found")

    if obs.case_id:
        case = db.get(AgriculturalCase, obs.case_id)
        if case:
            return case

    # Auto-create a case
    case = AgriculturalCase(
        farmer_id=farmer.id,
        farm_id=obs.farm_id,
        crop_id=obs.crop_id,
        title=f"Case for Observation #{observation_id}",
        status=CaseStatus.OPEN,
    )
    db.add(case)
    db.flush()
    obs.case_id = case.id
    db.add(obs)
    db.commit()
    db.refresh(case)
    return case


def list_cases(
    current_user: User,
    db: Session,
    status: Optional[CaseStatus] = None,
    farm_id: Optional[int] = None,
) -> List[AgriculturalCase]:
    farmer = _require_farmer(current_user)

    query = db.query(AgriculturalCase).filter(AgriculturalCase.farmer_id == farmer.id)
    if status:
        query = query.filter(AgriculturalCase.status == status)
    if farm_id:
        query = query.filter(AgriculturalCase.farm_id == farm_id)
    return query.order_by(AgriculturalCase.updated_at.desc()).all()


def get_case_detail(current_user: User, case_id: int, db: Session) -> AgriculturalCase:
    farmer = _require_farmer(current_user)
    return _get_own_case(case_id, farmer, db)


def update_case(
    current_user: User, case_id: int, payload: CaseUpdate, db: Session
) -> AgriculturalCase:
    farmer = _require_farmer(current_user)
    case = _get_own_case(case_id, farmer, db)

    if payload.title is not None:
        case.title = payload.title
    if payload.description is not None:
        case.description = payload.description
    if payload.status is not None:
        case.status = payload.status
    case.updated_at = datetime.now(timezone.utc)

    db.add(case)
    db.commit()
    db.refresh(case)
    return case


def submit_case_to_expert(
    current_user: User,
    case_id: int,
    payload: SubmitToExpertRequest,
    db: Session,
) -> AgriculturalCase:
    farmer = _require_farmer(current_user)
    case = _get_own_case(case_id, farmer, db)

    if case.status not in (CaseStatus.OPEN, CaseStatus.PENDING_EXPERT):
        status_val = case.status.value if hasattr(case.status, "value") else str(case.status)
        raise AppException(
            status_code=400,
            detail=f"Cannot submit case with status '{status_val}' to expert.",
        )

    case.status = CaseStatus.PENDING_EXPERT
    case.updated_at = datetime.now(timezone.utc)

    # Mark all OPEN/AI_ANALYZED observations in this case as PENDING_EXPERT
    for obs in case.observations:
        obs_status_str = obs.status.value if hasattr(obs.status, "value") else str(obs.status)
        if obs_status_str in ("AI_ANALYZED", "READY_FOR_AI", "SUBMITTED"):
            obs.status = ObservationStatus.PENDING_EXPERT
            db.add(obs)

    db.add(case)
    db.commit()
    db.refresh(case)
    return case


def add_follow_up_observation(
    current_user: User, case_id: int, observation_id: int, db: Session
) -> AgriculturalCase:
    farmer = _require_farmer(current_user)
    case = _get_own_case(case_id, farmer, db)

    obs = db.get(Observation, observation_id)
    if not obs or obs.farmer_id != farmer.id:
        raise AppException(status_code=404, detail="Observation not found")
    if obs.case_id and obs.case_id != case_id:
        raise AppException(
            status_code=400, detail="Observation is already linked to a different case."
        )

    obs.case_id = case.id
    db.add(obs)
    case.updated_at = datetime.now(timezone.utc)
    db.add(case)
    db.commit()
    db.refresh(case)
    return case


def report_observation_to_expert(
    current_user: User, observation_id: int, db: Session
) -> AgriculturalCase:
    """
    Convenience function: find or create case for an observation, then submit it to expert.
    Used by the farmer 'Submit Report to Expert' button.
    """
    case = get_or_create_case_for_observation(current_user, observation_id, db)
    return submit_case_to_expert(
        current_user, case.id, SubmitToExpertRequest(), db
    )


def add_follow_up_with_upload(
    current_user: User,
    case_id: int,
    file: UploadFile,
    latitude: float | None,
    longitude: float | None,
    db: Session,
) -> AgriculturalCase:
    """
    Accepts a follow-up image upload from a farmer for an existing case.
    Creates an Observation linked to the case, runs image quality check, Cloudinary upload,
    and immediately triggers AI pathology analysis.
    """
    farmer = _require_farmer(current_user)
    case = _get_own_case(case_id, farmer, db)

    # Create observation linked to case's farm_id and crop_id
    obs = create_observation_with_upload(
        farm_id=case.farm_id,
        crop_id=case.crop_id,
        file=file,
        latitude=latitude,
        longitude=longitude,
        current_user=farmer,
        db=db,
    )

    # Link observation to case
    obs.case_id = case.id
    db.add(obs)

    # Prepare AI analysis context & run pathology AI analysis automatically
    farm = db.scalar(select(Farm).where(Farm.id == case.farm_id))
    env_context = get_environmental_context(
        farm=farm,
        latitude=obs.latitude,
        longitude=obs.longitude,
        observation_id=obs.id,
        db=db,
    )
    context = AIAnalysisContext(
        crop={"crop_type": case.crop.crop_type if case.crop else "Crop"},
        weather=env_context,
    )

    try:
        run_ai_analysis(
            db=db,
            observation=obs,
            context=context,
            model_version="v1.0.0",
        )
    except Exception as e:
        print(f"Warning: Auto AI analysis for follow-up observation #{obs.id} failed: {e}")

    # Update case updated timestamp
    case.updated_at = datetime.now(timezone.utc)
    db.add(case)
    db.commit()
    db.refresh(case)
    return case


def get_case_timeline(
    current_user: User,
    case_id: int,
    db: Session,
) -> dict:
    """
    Retrieves the complete chronological timeline of a case:
    all observations (with AI analyses), and expert validations.
    """
    case = db.get(AgriculturalCase, case_id)
    if not case:
        raise AppException(status_code=404, detail="Case not found")

    role_val = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role_val == "farmer" and case.farmer_id != current_user.id:
        raise AppException(status_code=404, detail="Case not found")

    # Fetch observations sorted by observed_at / created_at ASC
    observations = (
        db.query(Observation)
        .filter(Observation.case_id == case_id)
        .order_by(Observation.observed_at.asc(), Observation.created_at.asc())
        .all()
    )

    timeline_items = []
    for obs in observations:
        latest_ai = obs.ai_analyses[-1] if obs.ai_analyses else None
        ai_data = None
        if latest_ai:
            ai_data = {
                "id": latest_ai.id,
                "predicted_disease": latest_ai.predicted_disease,
                "predicted_pest": latest_ai.predicted_pest,
                "disease_probability": latest_ai.disease_probability,
                "pest_probability": latest_ai.pest_probability,
                "risk_level": latest_ai.risk_level.value if hasattr(latest_ai.risk_level, "value") else str(latest_ai.risk_level) if latest_ai.risk_level else None,
                "confidence_score": latest_ai.confidence_score,
                "created_at": latest_ai.created_at,
            }

        timeline_items.append({
            "type": "observation",
            "id": obs.id,
            "image_url": obs.image_url,
            "status": obs.status.value if hasattr(obs.status, "value") else str(obs.status),
            "image_quality_score": obs.image_quality_score,
            "latitude": obs.latitude,
            "longitude": obs.longitude,
            "observed_at": obs.observed_at,
            "created_at": obs.created_at,
            "ai_analysis": ai_data,
        })

    for v in case.validations:
        timeline_items.append({
            "type": "expert_validation",
            "id": v.id,
            "expert_id": v.expert_id,
            "validation_result": v.validation_result.value if hasattr(v.validation_result, "value") else str(v.validation_result),
            "corrected_disease": v.corrected_disease,
            "corrected_pest": v.corrected_pest,
            "comments": v.comments,
            "treatment_recommendation": v.treatment_recommendation,
            "created_at": v.created_at,
        })

    # Sort timeline items chronologically
    timeline_items.sort(key=lambda x: x["created_at"] or datetime.min)

    return {
        "case_id": case.id,
        "title": case.title,
        "description": case.description,
        "status": case.status.value if hasattr(case.status, "value") else str(case.status),
        "farmer_id": case.farmer_id,
        "farm_id": case.farm_id,
        "crop_id": case.crop_id,
        "created_at": case.created_at,
        "updated_at": case.updated_at,
        "timeline": timeline_items,
    }
