from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.enums.case import CaseStatus

if TYPE_CHECKING:
    from app.models.crop import Crop
    from app.models.farm import Farm
    from app.models.observation import Observation
    from app.models.user import User
    from app.models.expert_validation import ExpertValidation


class AgriculturalCase(Base):
    __tablename__ = "agricultural_cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    farmer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    farm_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False
    )
    crop_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("crops.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[CaseStatus] = mapped_column(
        String(50), nullable=False, default=CaseStatus.OPEN
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    farmer: Mapped["User"] = relationship("User", foreign_keys=[farmer_id])
    farm: Mapped["Farm"] = relationship("Farm")
    crop: Mapped["Crop"] = relationship("Crop")
    observations: Mapped[List["Observation"]] = relationship(
        "Observation",
        back_populates="case",
        order_by="Observation.observed_at",
        foreign_keys="Observation.case_id",
    )
    validations: Mapped[List["ExpertValidation"]] = relationship(
        "ExpertValidation",
        back_populates="case",
        order_by="ExpertValidation.created_at",
    )

    @property
    def farmer_name(self) -> Optional[str]:
        return self.farmer.name if self.farmer else None

    @property
    def farm_name(self) -> Optional[str]:
        return self.farm.farm_name if self.farm else None
