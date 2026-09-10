from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.enums.validation import ValidationResult

if TYPE_CHECKING:
    from app.models.agricultural_case import AgriculturalCase
    from app.models.observation import Observation
    from app.models.user import User


class ExpertValidation(Base):
    __tablename__ = "expert_validations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    case_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("agricultural_cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    observation_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("observations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    expert_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    validation_result: Mapped[ValidationResult] = mapped_column(
        String(50), nullable=False
    )
    corrected_disease: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    corrected_pest: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    treatment_recommendation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    case: Mapped["AgriculturalCase"] = relationship(
        "AgriculturalCase", back_populates="validations"
    )
    observation: Mapped[Optional["Observation"]] = relationship("Observation")
    expert: Mapped["User"] = relationship("User", foreign_keys=[expert_id])

    @property
    def expert_name(self) -> Optional[str]:
        return self.expert.name if self.expert else None

    @property
    def expert_organization(self) -> Optional[str]:
        if self.expert and getattr(self.expert, "expert_profile", None):
            return self.expert.expert_profile.organization
        return None
