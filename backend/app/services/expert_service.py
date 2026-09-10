from typing import List, Optional

import sqlalchemy
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import AppException
from app.enums.case import CaseStatus
from app.enums.observation import ObservationStatus
from app.enums.validation import ValidationResult
from app.models.agricultural_case import AgriculturalCase
from app.models.expert_validation import ExpertValidation
from app.models.user import User, UserRole
from app.schemas.expert_validation import ExpertValidationCreate, ExpertValidationResponse


def _require_expert(current_user: User) -> User:
    # Get role value as a string - handle both enum and string storage
    if hasattr(current_user.role, "value"):
        role_val = current_user.role.value  # Enum case
    else:
        role_val = str(current_user.role)  # String case from DB
    
    if role_val != "expert":
        raise AppException(status_code=403, detail="Only experts can perform this action")
    return current_user


def list_review_queue(
    current_user: User, db: Session, status_filter: Optional[CaseStatus] = None
) -> List[AgriculturalCase]:
    _require_expert(current_user)

    status = status_filter if status_filter else CaseStatus.PENDING_EXPERT
    return (
        db.query(AgriculturalCase)
        .options(
            # Eager-load relationships so CaseResponse can serialize them
            sqlalchemy.orm.joinedload(AgriculturalCase.farm),
            sqlalchemy.orm.joinedload(AgriculturalCase.crop),
            sqlalchemy.orm.joinedload(AgriculturalCase.farmer),
        )
        .filter(AgriculturalCase.status == status)
        .order_by(AgriculturalCase.updated_at.asc())
        .all()
    )


def get_review_case_detail(current_user: User, case_id: int, db: Session) -> AgriculturalCase:
    _require_expert(current_user)

    case = (
        db.query(AgriculturalCase)
        .options(
            sqlalchemy.orm.joinedload(AgriculturalCase.farm),
            sqlalchemy.orm.joinedload(AgriculturalCase.crop),
            sqlalchemy.orm.joinedload(AgriculturalCase.farmer),
            sqlalchemy.orm.joinedload(AgriculturalCase.observations),
            sqlalchemy.orm.joinedload(AgriculturalCase.validations)
            .joinedload(ExpertValidation.expert),
        )
        .filter(AgriculturalCase.id == case_id)
        .first()
    )
    if not case:
        raise AppException(status_code=404, detail="Case not found")
    if case.status == CaseStatus.CLOSED:
        raise AppException(status_code=400, detail="Case is closed.")
    return case


def validate_case(
    current_user: User,
    case_id: int,
    payload: ExpertValidationCreate,
    db: Session,
) -> ExpertValidation:
    expert = _require_expert(current_user)

    case = db.get(AgriculturalCase, case_id)
    if not case:
        raise AppException(status_code=404, detail="Case not found")
    if case.status not in (CaseStatus.PENDING_EXPERT,):
        status_val = case.status.value if hasattr(case.status, "value") else str(case.status)
        raise AppException(
            status_code=400,
            detail=f"Case must be in PENDING_EXPERT status to validate. Current status: {status_val}",
        )

    # Create validation record — NEVER overwrite AIAnalysis
    validation = ExpertValidation(
        case_id=case.id,
        expert_id=expert.id,
        validation_result=payload.validation_result,
        corrected_disease=payload.corrected_disease,
        corrected_pest=payload.corrected_pest,
        comments=payload.comments,
        treatment_recommendation=payload.treatment_recommendation,
    )
    db.add(validation)

    # Update case status
    if payload.validation_result == ValidationResult.NEEDS_INVESTIGATION:
        case.status = CaseStatus.PENDING_EXPERT  # stays pending, needs more work
    else:
        case.status = CaseStatus.VALIDATED

    # Update all PENDING_EXPERT observations in the case to VALIDATED
    if case.status == CaseStatus.VALIDATED:
        for obs in case.observations:
            # Get status as string for consistent comparison
            obs_status_str = obs.status.value if hasattr(obs.status, "value") else str(obs.status)
            if obs_status_str == "PENDING_EXPERT":
                obs.status = ObservationStatus.VALIDATED
                db.add(obs)

    db.add(case)
    db.commit()
    db.refresh(validation)

    # Populate expert relationship on validation so response serializes expert_name/org
    db.refresh(validation)
    validation.expert = expert
    return validation
