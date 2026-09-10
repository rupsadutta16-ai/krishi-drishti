from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_role
from app.db.database import get_db
from app.models.user import User, UserRole
from app.models.expert_profile import ExpertProfile
from app.models.farmer_profile import FarmerProfile
from app.models.observation import Observation
from app.schemas.case import CaseResponse
from app.schemas.expert_validation import ExpertValidationCreate, ExpertValidationResponse
from app.schemas.ai_analysis import AIAnalysisResponse
from app.schemas.user import ExpertPublicProfileResponse, FarmerPublicProfileResponse
from app.services import expert_service
from app.services.ai_service import get_latest_analysis
from app.core.exceptions import AppException

router = APIRouter(prefix="/expert", tags=["expert"])


# ── Expert Review Queue ──────────────────────────────────────────────────────

@router.get("/cases", response_model=List[CaseResponse])
def get_review_queue(
    current_user: User = Depends(require_role(["expert"])),
    db: Session = Depends(get_db),
):
    return expert_service.list_review_queue(current_user, db)


@router.get("/cases/{case_id}", response_model=CaseResponse)
def get_review_case_detail(
    case_id: int,
    current_user: User = Depends(require_role(["expert"])),
    db: Session = Depends(get_db),
):
    return expert_service.get_review_case_detail(current_user, case_id, db)


@router.post("/cases/{case_id}/validate", response_model=ExpertValidationResponse)
def validate_case(
    case_id: int,
    payload: ExpertValidationCreate,
    current_user: User = Depends(require_role(["expert"])),
    db: Session = Depends(get_db),
):
    return expert_service.validate_case(current_user, case_id, payload, db)


@router.get("/observations/{observation_id}/ai-analysis", response_model=AIAnalysisResponse)
def get_observation_ai_analysis(
    observation_id: int,
    current_user: User = Depends(require_role(["expert"])),
    db: Session = Depends(get_db),
):
    """Get the latest AI analysis for an observation. Expert-only access."""
    obs = db.scalar(select(Observation).where(Observation.id == observation_id))
    if not obs:
        raise AppException(status_code=404, detail="Observation not found")

    latest = get_latest_analysis(db, observation_id)
    if not latest:
        raise AppException(
            status_code=404,
            detail="No AI analysis found for this observation",
        )
    return latest


# ── Public Expert Directory ───────────────────────────────────────────────────

@router.get(
    "/directory",
    response_model=List[ExpertPublicProfileResponse],
    tags=["Public"],
    summary="List all expert public profiles",
)
def list_expert_directory(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns public profiles of all expert accounts.
    Accessible by any authenticated user (farmers, officials, other experts).
    """
    experts = db.scalars(
        select(User).where(User.role == UserRole.EXPERT, User.is_active == True)
    ).all()

    result = []
    for u in experts:
        ep = u.expert_profile
        result.append(ExpertPublicProfileResponse(
            id=u.id,
            name=u.name,
            username=u.username,
            specialization=ep.specialization if ep else None,
            qualification=ep.qualification if ep else None,
            organization=ep.organization if ep else None,
            phone=ep.phone if ep else None,
            address=ep.address if ep else None,
            is_verified=ep.is_verified if ep else False,
        ))
    return result


@router.get(
    "/directory/{expert_id}",
    response_model=ExpertPublicProfileResponse,
    tags=["Public"],
    summary="Get a single expert's public profile",
)
def get_expert_public_profile(
    expert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns the public profile of a specific expert by user ID."""
    u = db.scalar(
        select(User).where(User.id == expert_id, User.role == UserRole.EXPERT)
    )
    if not u:
        raise AppException(status_code=404, message="Expert not found")

    ep = u.expert_profile
    return ExpertPublicProfileResponse(
        id=u.id,
        name=u.name,
        username=u.username,
        specialization=ep.specialization if ep else None,
        qualification=ep.qualification if ep else None,
        organization=ep.organization if ep else None,
        phone=ep.phone if ep else None,
        address=ep.address if ep else None,
        is_verified=ep.is_verified if ep else False,
    )


# ── Farmer Public Profile (for experts viewing case farmers) ─────────────────

@router.get(
    "/farmers/{farmer_id}",
    response_model=FarmerPublicProfileResponse,
    tags=["Expert Portal"],
    summary="Get a farmer's public profile (expert access)",
)
def get_farmer_public_profile(
    farmer_id: int,
    current_user: User = Depends(require_role(["expert"])),
    db: Session = Depends(get_db),
):
    """
    Returns safe public info about a farmer.
    Intended for experts who are reviewing a farmer's crop health case.
    """
    u = db.scalar(
        select(User).where(User.id == farmer_id, User.role == UserRole.FARMER)
    )
    if not u:
        raise AppException(status_code=404, message="Farmer not found")

    fp = u.farmer_profile
    return FarmerPublicProfileResponse(
        id=u.id,
        name=u.name or u.username,
        username=u.username,
        email=u.email,
        phone=fp.phone if fp else None,
        village=fp.village if fp else None,
        district=fp.district if fp else None,
        state=fp.state if fp else None,
        preferred_language=fp.preferred_language if fp else None,
    )
