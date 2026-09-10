from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user, require_role
from app.db.database import get_db
from app.models.user import User
from app.schemas.case import CaseResponse
from app.schemas.expert_validation import ExpertValidationCreate, ExpertValidationResponse
from app.services import expert_service

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
