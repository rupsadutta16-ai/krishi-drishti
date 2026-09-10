from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.case import (
    CaseCreate,
    CaseListResponse,
    CaseResponse,
    CaseUpdate,
    SubmitToExpertRequest,
)
from app.services import case_service

router = APIRouter(prefix="/farmer", tags=["farmer-cases"])


@router.post("/cases", response_model=CaseResponse, status_code=201)
def create_case(
    payload: CaseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return case_service.create_case(current_user, payload, db)


@router.get("/cases", response_model=List[CaseResponse])
def list_cases(
    status: Optional[str] = None,
    farm_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.enums.case import CaseStatus
    status_enum = CaseStatus(status) if status else None
    return case_service.list_cases(current_user, db, status_enum, farm_id)


@router.get("/cases/{case_id}", response_model=CaseResponse)
def get_case_detail(
    case_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return case_service.get_case_detail(current_user, case_id, db)


@router.patch("/cases/{case_id}", response_model=CaseResponse)
def update_case(
    case_id: int,
    payload: CaseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return case_service.update_case(current_user, case_id, payload, db)


@router.post("/cases/{case_id}/submit-to-expert", response_model=CaseResponse)
def submit_case_to_expert(
    case_id: int,
    payload: SubmitToExpertRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return case_service.submit_case_to_expert(current_user, case_id, payload, db)


@router.post("/observations/{observation_id}/report-to-expert", response_model=CaseResponse)
def report_observation_to_expert(
    observation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return case_service.report_observation_to_expert(current_user, observation_id, db)


@router.post("/cases/{case_id}/follow-up/{observation_id}", response_model=CaseResponse)
def add_follow_up_observation(
    case_id: int,
    observation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return case_service.add_follow_up_observation(current_user, case_id, observation_id, db)
