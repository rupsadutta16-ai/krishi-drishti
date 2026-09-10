from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_role
from app.db.database import get_db
from app.models.user import User
from app.models.observation import Observation
from app.schemas.case import CaseResponse
from app.schemas.expert_validation import ExpertValidationCreate, ExpertValidationResponse
from app.schemas.ai_analysis import AIAnalysisResponse
from app.services import expert_service
from app.services.ai_service import get_latest_analysis
from app.core.exceptions import AppException

router = APIRouter(prefix="/expert", tags=["expert"])


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
