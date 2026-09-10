from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.enums.case import CaseStatus
from app.enums.observation import ObservationStatus
from app.models.agricultural_case import AgriculturalCase
from app.models.observation import Observation
from app.models.user import User, UserRole
from app.schemas.case import CaseCreate, CaseListResponse, CaseResponse, CaseUpdate, SubmitToExpertRequest


def _require_farmer(current_user: User) -> User:
    role_val = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    if role_val != "farmer" and current_user.role != UserRole.FARMER:
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
        obs_status = obs.status.value if hasattr(obs.status, "value") else str(obs.status)
        if obs.status in (
            ObservationStatus.AI_ANALYZED,
            ObservationStatus.READY_FOR_AI,
            ObservationStatus.SUBMITTED,
        ) or obs_status.upper() in ("AI_ANALYZED", "READY_FOR_AI", "SUBMITTED"):
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
