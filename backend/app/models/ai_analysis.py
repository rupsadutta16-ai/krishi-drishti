from datetime import datetime, UTC

from sqlalchemy import String, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.enums.ai_analysis import RiskLevel, AIAnalysisStatus


class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id: Mapped[int] = mapped_column(primary_key=True)

    observation_id: Mapped[int] = mapped_column(
        ForeignKey("observations.id", ondelete="CASCADE"), nullable=False
    )

    predicted_disease: Mapped[str | None] = mapped_column(String(255), nullable=True)

    predicted_pest: Mapped[str | None] = mapped_column(String(255), nullable=True)

    disease_probability: Mapped[float | None] = mapped_column(Float, nullable=True)

    pest_probability: Mapped[float | None] = mapped_column(Float, nullable=True)

    risk_level: Mapped[RiskLevel | None] = mapped_column(String(50), nullable=True)

    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    model_version: Mapped[str] = mapped_column(
        String(100), default="v1.0.0", nullable=False
    )

    status: Mapped[AIAnalysisStatus] = mapped_column(
        String(50), default=AIAnalysisStatus.PENDING, nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    # Relationships
    observation: Mapped["Observation"] = relationship(back_populates="ai_analyses")
