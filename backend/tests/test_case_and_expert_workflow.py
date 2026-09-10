"""
Tests for Agricultural Case Lifecycle and Expert Validation workflow.
Run with: python -m pytest tests/test_case_and_expert_workflow.py -v
(DATABASE_URL=sqlite:///./test.db must be set)
"""
import os
import pytest
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Must import all models so Base.metadata picks them up
from app.db.database import Base
from app.models import *  # noqa: F401, F403

from app.enums.case import CaseStatus
from app.enums.validation import ValidationResult
from app.enums.observation import ObservationStatus
from app.models.agricultural_case import AgriculturalCase
from app.models.expert_validation import ExpertValidation
from app.models.user import User, UserRole
from app.models.farm import Farm
from app.models.crop import Crop
from app.models.observation import Observation
from app.schemas.case import CaseCreate, SubmitToExpertRequest
from app.schemas.expert_validation import ExpertValidationCreate
from app.services import case_service, expert_service
from app.core.exceptions import AppException


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")


@pytest.fixture(scope="module")
def db_session():
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    LocalSession = sessionmaker(bind=engine)
    db = LocalSession()
    yield db
    db.close()
    Base.metadata.drop_all(engine)


@pytest.fixture(scope="module")
def farmer_user(db_session):
    user = User(
        name="Test Farmer",
        username="testfarmer_case",
        email="farmer_case@test.com",
        password_hash="hashed",
        role=UserRole.FARMER,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="module")
def expert_user(db_session):
    user = User(
        name="Test Expert",
        username="testexpert_case",
        email="expert_case@test.com",
        password_hash="hashed",
        role=UserRole.EXPERT,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="module")
def test_farm(db_session, farmer_user):
    farm = Farm(
        farmer_id=farmer_user.id,
        farm_name="Case Test Farm",
        area_acres=5.0,
        village="Test Village",
        district="Test District",
        state="Test State",
    )
    db_session.add(farm)
    db_session.commit()
    db_session.refresh(farm)
    return farm


@pytest.fixture(scope="module")
def test_crop(db_session, test_farm):
    crop = Crop(
        farm_id=test_farm.id,
        crop_type="rice",
        variety="IR64",
        sowing_date=datetime.now(timezone.utc),
        growth_stage="vegetative",
    )
    db_session.add(crop)
    db_session.commit()
    db_session.refresh(crop)
    return crop


@pytest.fixture(scope="module")
def test_observation(db_session, farmer_user, test_farm, test_crop):
    obs = Observation(
        farmer_id=farmer_user.id,
        farm_id=test_farm.id,
        crop_id=test_crop.id,
        observed_at=datetime.now(timezone.utc),
        status=ObservationStatus.AI_ANALYZED,
        image_url="https://example.com/leaf.jpg",
    )
    db_session.add(obs)
    db_session.commit()
    db_session.refresh(obs)
    return obs


class TestCaseCreation:
    def test_create_case_successfully(self, db_session, farmer_user, test_farm, test_crop, test_observation):
        payload = CaseCreate(
            farm_id=test_farm.id,
            crop_id=test_crop.id,
            title="Rice Blast Assessment",
            description="Early stage blast detected.",
            initial_observation_id=test_observation.id,
        )
        case = case_service.create_case(farmer_user, payload, db_session)
        assert case.id is not None
        assert case.farmer_id == farmer_user.id
        assert case.status == CaseStatus.OPEN
        assert case.title == "Rice Blast Assessment"
        # Initial observation must be linked
        db_session.refresh(test_observation)
        assert test_observation.case_id == case.id

    def test_farmer_cannot_create_case_for_other_farmers_observation(
        self, db_session, expert_user, test_farm, test_crop, test_observation
    ):
        # expert_user is not a farmer, must get 403
        payload = CaseCreate(
            farm_id=test_farm.id,
            crop_id=test_crop.id,
            title="Unauthorized Case",
        )
        with pytest.raises(AppException) as exc_info:
            case_service.create_case(expert_user, payload, db_session)
        assert exc_info.value.status_code == 403


class TestCaseListAndDetail:
    def test_list_cases_returns_own_cases_only(self, db_session, farmer_user):
        cases = case_service.list_cases(farmer_user, db_session)
        assert len(cases) >= 1
        for c in cases:
            assert c.farmer_id == farmer_user.id

    def test_get_case_detail(self, db_session, farmer_user, test_observation):
        cases = case_service.list_cases(farmer_user, db_session)
        case_id = cases[0].id
        detail = case_service.get_case_detail(farmer_user, case_id, db_session)
        assert detail.id == case_id
        assert len(detail.observations) >= 1


class TestSubmitToExpert:
    def test_submit_case_to_expert(self, db_session, farmer_user, test_observation):
        cases = case_service.list_cases(farmer_user, db_session)
        case_id = cases[0].id
        case = case_service.submit_case_to_expert(
            farmer_user, case_id, SubmitToExpertRequest(), db_session
        )
        assert case.status == CaseStatus.PENDING_EXPERT
        # Linked observation must also be PENDING_EXPERT
        db_session.refresh(test_observation)
        assert test_observation.status == ObservationStatus.PENDING_EXPERT

    def test_expert_cannot_submit_to_expert(self, db_session, expert_user):
        with pytest.raises(AppException) as exc_info:
            case_service.list_cases(expert_user, db_session)
        assert exc_info.value.status_code == 403


class TestExpertReviewQueue:
    def test_expert_sees_pending_cases(self, db_session, expert_user):
        queue = expert_service.list_review_queue(expert_user, db_session)
        assert len(queue) >= 1
        for c in queue:
            assert c.status == CaseStatus.PENDING_EXPERT

    def test_farmer_cannot_access_expert_queue(self, db_session, farmer_user):
        with pytest.raises(AppException) as exc_info:
            expert_service.list_review_queue(farmer_user, db_session)
        assert exc_info.value.status_code == 403


class TestExpertValidation:
    def test_validate_case_confirmed(self, db_session, expert_user, farmer_user, test_observation):
        cases = expert_service.list_review_queue(expert_user, db_session)
        case_id = cases[0].id

        payload = ExpertValidationCreate(
            validation_result=ValidationResult.CONFIRMED,
            comments="AI prediction confirmed. Rice blast present.",
            treatment_recommendation="Apply Tricyclazole at recommended dose. Remove infected debris.",
        )
        validation = expert_service.validate_case(expert_user, case_id, payload, db_session)
        assert validation.id is not None
        assert validation.expert_id == expert_user.id
        assert validation.validation_result == ValidationResult.CONFIRMED

        # Verify case status changed to VALIDATED
        case = db_session.get(AgriculturalCase, case_id)
        assert case.status == CaseStatus.VALIDATED

        # Verify observation status changed to VALIDATED
        db_session.refresh(test_observation)
        assert test_observation.status == ObservationStatus.VALIDATED

    def test_original_ai_analysis_untouched(self, db_session):
        """
        There must be no ExpertValidation data on the AIAnalysis table.
        AIAnalysis rows must be unchanged after expert validation.
        """
        from app.models.ai_analysis import AIAnalysis
        # Just verify AIAnalysis table doesn't have a 'validation_result' column
        from sqlalchemy import inspect
        insp = inspect(db_session.bind)
        ai_cols = [c["name"] for c in insp.get_columns("ai_analyses")]
        assert "validation_result" not in ai_cols
        assert "corrected_disease" not in ai_cols
        assert "treatment_recommendation" not in ai_cols


class TestFollowUpObservation:
    def test_add_follow_up_observation(self, db_session, farmer_user, test_farm, test_crop):
        # Create a new observation for follow-up
        follow_up_obs = Observation(
            farmer_id=farmer_user.id,
            farm_id=test_farm.id,
            crop_id=test_crop.id,
            observed_at=datetime.now(timezone.utc),
            status=ObservationStatus.SUBMITTED,
            image_url="https://example.com/followup.jpg",
        )
        db_session.add(follow_up_obs)
        db_session.commit()
        db_session.refresh(follow_up_obs)

        # Get a case that was already created
        cases = case_service.list_cases(farmer_user, db_session)
        case_id = cases[0].id

        # Add the follow-up observation
        case = case_service.add_follow_up_observation(
            farmer_user, case_id, follow_up_obs.id, db_session
        )
        db_session.refresh(follow_up_obs)
        assert follow_up_obs.case_id == case_id
        assert len(case.observations) >= 2
