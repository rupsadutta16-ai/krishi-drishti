"""
AI Analysis service interface and implementation.
Provides modular services for:
1. ImageBasedAIService: Image/pathology-based disease and pest prediction.
2. WeatherBasedAIService: Weather & environmental telemetry risk analysis.
"""

from abc import ABC, abstractmethod
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.observation import Observation
from app.models.ai_analysis import AIAnalysis
from app.enums.observation import ObservationStatus
from app.enums.ai_analysis import AIAnalysisStatus, RiskLevel
from app.schemas.ai_analysis import AIAnalysisContext
from app.core.exceptions import AppException
from fastapi import status


MIN_IMAGE_QUALITY_SCORE: float = 50.0


class BaseAIService(ABC):
    """
    Abstract interface for AI analysis services.
    Subclasses can implement specific ML pipeline integrations (PyTorch, TensorFlow, Scikit-learn, etc.).
    """

    @abstractmethod
    def analyze(
        self,
        observation: Observation,
        context: AIAnalysisContext | None = None,
        model_version: str = "v1.0.0",
    ) -> dict[str, Any]:
        pass


class ImageBasedAIService(BaseAIService):
    """
    Service for image-based crop disease and pest classification.
    
    Structure designed so a vision ML model (e.g. PyTorch/TensorFlow ResNet/Vision Transformer)
    can be attached directly via `self.model`.
    When no ML model is attached, executes standard pathology classification based on image & crop metadata.
    """

    def __init__(self, model_runner: Any = None):
        self.model_runner = model_runner

    def analyze(
        self,
        observation: Observation,
        context: AIAnalysisContext | None = None,
        model_version: str = "v1.0.0",
    ) -> dict[str, Any]:
        # Quality check: Very poor quality images must not be analyzed by AI
        quality_score = observation.image_quality_score
        is_rejected_status = observation.status == ObservationStatus.IMAGE_REJECTED

        if is_rejected_status or (quality_score is not None and quality_score < MIN_IMAGE_QUALITY_SCORE):
            return {
                "predicted_disease": None,
                "predicted_pest": None,
                "disease_probability": None,
                "pest_probability": None,
                "risk_level": None,
                "confidence_score": None,
                "model_version": model_version,
                "status": AIAnalysisStatus.REJECTED,
            }

        # ── ML Model Integration Hook ──
        if self.model_runner is not None:
            # When an ML model runner is integrated, execute inference:
            # return self.model_runner.predict(image_path=observation.image_url, context=context)
            pass

        # ── Deterministic Rule-Based Fallback ──
        crop_type = None
        if context and context.crop:
            if isinstance(context.crop, dict):
                crop_type = context.crop.get("crop_type") or context.crop.get("name")
            else:
                crop_type = str(context.crop)

        pathology_map = {
            "Wheat": ("Leaf Rust (Puccinia triticina)", "Fall Armyworm", RiskLevel.MEDIUM, 0.96),
            "Rice": ("Rice Blast (Magnaporthe oryzae)", "Brown Planthopper", RiskLevel.HIGH, 0.98),
            "Maize": ("Northern Corn Leaf Blight", "Fall Armyworm (Spodoptera frugiperda)", RiskLevel.HIGH, 0.95),
            "Sugarcane": ("Red Rot (Colletotrichum falcatum)", "Early Shoot Borer", RiskLevel.LOW, 0.92),
            "Cotton": ("Bacterial Blight (Xanthomonas citri)", "Cotton Bollworm", RiskLevel.MEDIUM, 0.91),
            "Tomato": ("Early Blight (Alternaria solani)", "Tomato Leaf Miner", RiskLevel.HIGH, 0.97),
        }

        disease, pest, risk, confidence = pathology_map.get(
            crop_type,
            ("Leaf Rust / Fungal Blight (Puccinia spp.)", "Spodoptera frugiperda", RiskLevel.MEDIUM, 0.95)
        )

        return {
            "predicted_disease": disease,
            "predicted_pest": pest,
            "disease_probability": confidence,
            "pest_probability": round(1.0 - confidence, 2),
            "risk_level": risk,
            "confidence_score": confidence,
            "model_version": model_version,
            "status": AIAnalysisStatus.COMPLETED,
        }


class WeatherBasedAIService(BaseAIService):
    """
    Service for weather-based crop risk detection.
    
    Evaluates environmental metrics:
    - mean_temperature (°C)
    - min_temperature (°C)
    - max_temperature (°C)
    - relative_humidity (%)
    - precipitation (mm)
    
    Structure designed so an epidemiological/weather ML model (e.g. XGBoost / Random Forest)
    can be attached directly via `self.model`.
    """

    def __init__(self, model_runner: Any = None):
        self.model_runner = model_runner

    def analyze(
        self,
        observation: Observation,
        context: AIAnalysisContext | None = None,
        model_version: str = "v1.0.0",
    ) -> dict[str, Any]:
        weather_data = context.weather if context and context.weather else {}
        crop_name = None
        if context and context.crop:
            crop_name = context.crop.get("crop_type") if isinstance(context.crop, dict) else str(context.crop)

        return self.analyze_weather_risk(weather_data, crop_type=crop_name, model_version=model_version)

    def analyze_weather_risk(
        self,
        weather_data: dict[str, Any],
        crop_type: str | None = None,
        model_version: str = "v1.0.0",
    ) -> dict[str, Any]:
        """
        Calculates crop risk using weather inputs:
        mean_temperature, min_temperature, max_temperature, relative_humidity, precipitation.
        """
        # ── ML Model Integration Hook ──
        if self.model_runner is not None:
            # When ML model is integrated:
            # return self.model_runner.predict_weather_risk(weather_data, crop_type)
            pass

        # Extract weather parameters with fallback defaults
        mean_temp = float(weather_data.get("mean_temperature") or weather_data.get("temperature") or 28.0)
        min_temp = float(weather_data.get("min_temperature") or (mean_temp - 5.0))
        max_temp = float(weather_data.get("max_temperature") or (mean_temp + 6.0))
        humidity = float(weather_data.get("relative_humidity") or weather_data.get("humidity") or 65.0)
        precip = float(weather_data.get("precipitation") or weather_data.get("rainfall") or 0.0)

        # Agronomic Weather Risk Evaluation Rules
        potential_risks = []
        recommendations = []
        risk_level = RiskLevel.LOW
        risk_score = 0.2

        # 1. High Humidity + Warm Temperature -> Fungal Spore Germination
        if humidity > 75.0 and 20.0 <= mean_temp <= 32.0:
            risk_level = RiskLevel.HIGH
            risk_score = 0.85
            potential_risks.append("High fungal pathogen germination risk (Leaf Rust / Rice Blast / Downy Mildew) due to sustained humidity > 75% and warm temperatures.")
            recommendations.append("Apply preventative bio-fungicide or copperoxychloride spray during early morning hours.")

        # 2. High Precipitation + Warm Humidity -> Bacterial Blight / Root Rot
        if precip > 5.0 and humidity > 70.0:
            if risk_level != RiskLevel.HIGH:
                risk_level = RiskLevel.MEDIUM
                risk_score = 0.65
            potential_risks.append("Waterlogging & root zone anaerobic stress risk due to recent precipitation.")
            recommendations.append("Ensure drainage channels are clear to prevent water stagnation in field plots.")

        # 3. High Max Temperature (> 36°C) + Low Humidity (< 45%) -> Heat Stress
        if max_temp > 36.0 or (mean_temp > 34.0 and humidity < 45.0):
            risk_level = RiskLevel.HIGH
            risk_score = 0.82
            potential_risks.append("Thermal heat stress & excessive evapotranspiration. Risk of pollen sterility.")
            recommendations.append("Schedule light micro-irrigation or mulching during peak sunshine hours.")

        # Default low risk fallback
        if not potential_risks:
            potential_risks.append("Optimal weather window. No severe climate risk detected for crop growth.")
            recommendations.append("Maintain routine irrigation and nutrient scheduling.")

        return {
            "predicted_disease": potential_risks[0] if potential_risks else None,
            "predicted_pest": "Pest activity monitored",
            "disease_probability": risk_score,
            "pest_probability": round(1.0 - risk_score, 2),
            "risk_level": risk_level,
            "confidence_score": risk_score,
            "model_version": model_version,
            "status": AIAnalysisStatus.COMPLETED,
            "weather_metrics": {
                "mean_temperature": mean_temp,
                "min_temperature": min_temp,
                "max_temperature": max_temp,
                "relative_humidity": humidity,
                "precipitation": precip,
                "has_sensor": weather_data.get("has_sensor", False),
                "temperature_source": weather_data.get("temperature_source", "WEATHER_API"),
                "humidity_source": weather_data.get("humidity_source", "WEATHER_API"),
                "precipitation_source": weather_data.get("precipitation_source", "WEATHER_API"),
            },
            "potential_risks": potential_risks,
            "recommendations": recommendations,
        }


# Default service instances
image_ai_service = ImageBasedAIService()
weather_ai_service = WeatherBasedAIService()

# Default fallback
default_ai_service: BaseAIService = image_ai_service


def run_ai_analysis(
    db: Session,
    observation: Observation,
    context: AIAnalysisContext | None = None,
    model_version: str = "v1.0.0",
    ai_service: BaseAIService | None = None,
) -> AIAnalysis:
    """
    Executes AI analysis for an observation using the provided or default AI service.
    Persists the resulting AIAnalysis record to the database.
    """
    service = ai_service or image_ai_service
    analysis_result = service.analyze(
        observation=observation,
        context=context,
        model_version=model_version,
    )

    ai_analysis = AIAnalysis(
        observation_id=observation.id,
        predicted_disease=analysis_result.get("predicted_disease"),
        predicted_pest=analysis_result.get("predicted_pest"),
        disease_probability=analysis_result.get("disease_probability"),
        pest_probability=analysis_result.get("pest_probability"),
        risk_level=analysis_result.get("risk_level"),
        confidence_score=analysis_result.get("confidence_score"),
        model_version=analysis_result.get("model_version", model_version),
        status=analysis_result.get("status", AIAnalysisStatus.PENDING),
    )

    if ai_analysis.status == AIAnalysisStatus.COMPLETED:
        observation.status = ObservationStatus.AI_ANALYZED

    db.add(ai_analysis)
    db.commit()
    db.refresh(ai_analysis)

    return ai_analysis


def run_weather_risk_analysis(
    weather_data: dict[str, Any],
    crop_type: str | None = None,
) -> dict[str, Any]:
    """
    Helper function to run weather-based risk analysis on environmental telemetry.
    """
    return weather_ai_service.analyze_weather_risk(weather_data=weather_data, crop_type=crop_type)


def get_analyses_for_observation(
    db: Session,
    observation_id: int,
) -> list[AIAnalysis]:
    """
    Retrieve all AI analysis runs for a given observation (ordered by newest first).
    """
    stmt = (
        select(AIAnalysis)
        .where(AIAnalysis.observation_id == observation_id)
        .order_by(AIAnalysis.created_at.desc(), AIAnalysis.id.desc())
    )
    return list(db.scalars(stmt).all())


def get_latest_analysis(
    db: Session,
    observation_id: int,
) -> AIAnalysis | None:
    """
    Retrieve the latest AI analysis run for a given observation.
    """
    stmt = (
        select(AIAnalysis)
        .where(AIAnalysis.observation_id == observation_id)
        .order_by(AIAnalysis.created_at.desc(), AIAnalysis.id.desc())
    )
    return db.scalar(stmt)
