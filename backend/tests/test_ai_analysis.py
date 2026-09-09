from datetime import datetime, UTC
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.enums.ai_analysis import RiskLevel, AIAnalysisStatus
from app.enums.observation import ObservationStatus
from app.enums.crop import CropType, GrowthStage
from app.models import (
    User,
    FarmerProfile,
    ExpertProfile,
    OfficialProfile,
    Farm,
    Crop,
    Observation,
    AIAnalysis,
)

from app.schemas.ai_analysis import (
    AIAnalysisContext,
    AIAnalysisRequest,
    AIAnalysisResponse,
)
from app.services.ai_service import (
    BaseAIService,
    ImageBasedAIService,
    run_ai_analysis,
    get_analyses_for_observation,
    get_latest_analysis,
)


@pytest.fixture
def db_session():
    """Create in-memory SQLite database for testing."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture
def test_observation(db_session):
    """Fixture providing a user, farm, crop, and observation."""
    user = User(
        name="Farmer Joe",
        username="farmerjoe",
        email="farmer@example.com",
        password_hash="hashed_password",
        role="farmer",
        is_active=True,
    )

    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    farm = Farm(
        farmer_id=user.id,
        farm_name="Green Valley",
        area_acres=10.0,
    )
    db_session.add(farm)
    db_session.commit()
    db_session.refresh(farm)

    crop = Crop(
        farm_id=farm.id,
        crop_type=CropType.RICE,
        variety="IR64",
        growth_stage=GrowthStage.VEGETATIVE,
    )

    db_session.add(crop)
    db_session.commit()
    db_session.refresh(crop)

    observation = Observation(
        farmer_id=user.id,
        farm_id=farm.id,
        crop_id=crop.id,
        image_url="https://example.com/obs1.jpg",
        image_quality_score=85.0,
        status=ObservationStatus.READY_FOR_AI,
    )
    db_session.add(observation)
    db_session.commit()
    db_session.refresh(observation)

    return observation


def test_ai_analysis_enums():
    """Verify RiskLevel and AIAnalysisStatus enum members."""
    assert set(RiskLevel) == {RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL}
    assert set(AIAnalysisStatus) == {
        AIAnalysisStatus.PENDING,
        AIAnalysisStatus.COMPLETED,
        AIAnalysisStatus.LOW_CONFIDENCE,
        AIAnalysisStatus.EXPERT_REVIEW,
        AIAnalysisStatus.REJECTED,
    }


def test_ai_analysis_model_creation(db_session, test_observation):
    """Test AIAnalysis database model insertion and observation relationship."""
    analysis = AIAnalysis(
        observation_id=test_observation.id,
        predicted_disease=None,
        predicted_pest=None,
        disease_probability=None,
        pest_probability=None,
        risk_level=RiskLevel.MEDIUM,
        confidence_score=0.88,
        model_version="v1.0.0",
        status=AIAnalysisStatus.PENDING,
    )
    db_session.add(analysis)
    db_session.commit()
    db_session.refresh(analysis)

    assert analysis.id is not None
    assert analysis.observation_id == test_observation.id
    assert len(test_observation.ai_analyses) == 1
    assert test_observation.ai_analyses[0].id == analysis.id


def test_ai_service_image_quality_rejection(db_session, test_observation):
    """Very poor-quality images must not be analyzed by AI (status set to REJECTED)."""
    test_observation.image_quality_score = 30.0  # Below 50.0 threshold
    test_observation.status = ObservationStatus.IMAGE_REJECTED
    db_session.commit()

    analysis = run_ai_analysis(db=db_session, observation=test_observation)

    assert analysis.status == AIAnalysisStatus.REJECTED
    assert analysis.predicted_disease is None
    assert analysis.predicted_pest is None
    assert analysis.disease_probability is None


def test_ai_service_valid_quality_analysis(db_session, test_observation):
    """Valid quality image triggers AI analysis setup without fake predictions."""
    test_observation.image_quality_score = 90.0
    db_session.commit()

    context = AIAnalysisContext(
        crop={"name": "Rice", "variety": "IR64"},
        growth_stage=GrowthStage.VEGETATIVE,
        weather={"temperature": 28.5, "humidity": 75},
        sensor_data={"soil_moisture": 62.0},
    )

    analysis = run_ai_analysis(
        db=db_session,
        observation=test_observation,
        context=context,
        model_version="v1.2.0",
    )

    assert analysis.status == AIAnalysisStatus.COMPLETED
    assert analysis.model_version == "v1.2.0"
    assert analysis.predicted_disease == "Rice Blast (Magnaporthe oryzae)"


def test_multiple_ai_analyses_for_single_observation(db_session, test_observation):
    """One observation may have multiple AI analysis runs as models improve or re-run."""
    analysis1 = run_ai_analysis(db=db_session, observation=test_observation, model_version="v1.0.0")
    analysis2 = run_ai_analysis(db=db_session, observation=test_observation, model_version="v2.0.0")

    analyses = get_analyses_for_observation(db_session, test_observation.id)
    assert len(analyses) == 2
    assert analyses[0].model_version == "v2.0.0"
    assert analyses[1].model_version == "v1.0.0"

    latest = get_latest_analysis(db_session, test_observation.id)
    assert latest.id == analysis2.id


def test_custom_ml_service_integration(db_session, test_observation):
    """Test replacing BaseAIService with a real ML service implementation when ready."""

    class MockMLModelService(BaseAIService):
        def analyze(self, observation, context=None, model_version="v1.0.0"):
            # Mock real ML pipeline output structure
            return {
                "predicted_disease": "Bacterial Blight",
                "predicted_pest": None,
                "disease_probability": 0.94,
                "pest_probability": 0.05,
                "risk_level": RiskLevel.HIGH,
                "confidence_score": 0.94,
                "model_version": model_version,
                "status": AIAnalysisStatus.COMPLETED,
            }

    custom_service = MockMLModelService()
    analysis = run_ai_analysis(
        db=db_session,
        observation=test_observation,
        model_version="v3.0.0",
        ai_service=custom_service,
    )

    assert analysis.status == AIAnalysisStatus.COMPLETED
    assert analysis.predicted_disease == "Bacterial Blight"
    assert analysis.disease_probability == 0.94
    assert analysis.risk_level == RiskLevel.HIGH
    assert test_observation.status == ObservationStatus.AI_ANALYZED


def test_ai_analysis_schemas():
    """Verify Pydantic schemas validate correctly."""
    ctx = AIAnalysisContext(
        crop="Wheat",
        growth_stage="TILLERING",
        weather={"temp": 25},
        previous_observations=[{"id": 1, "disease": "None"}],
        nearby_reports=[{"location": "Village A", "pest": "Stem Borer"}],
        pest_trap_data={"count": 12, "species": "Spodoptera"},
        sensor_data={"leaf_wetness": 80},
        historical_cases=[{"year": 2025, "issue": "Blast"}],
    )
    req = AIAnalysisRequest(context=ctx, model_version="v1.0.0")
    assert req.context.crop == "Wheat"
    assert req.model_version == "v1.0.0"
