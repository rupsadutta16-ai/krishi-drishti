from datetime import datetime, UTC

from sqlalchemy import String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.enums.observation import ObservationStatus


class Observation(Base):
    __tablename__ = "observations"

    id: Mapped[int] = mapped_column(primary_key=True)

    case_id: Mapped[int | None] = mapped_column(Integer, nullable=True, default=None)

    farmer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    farm_id: Mapped[int] = mapped_column(
        ForeignKey("farms.id", ondelete="CASCADE"), nullable=False
    )

    crop_id: Mapped[int] = mapped_column(
        ForeignKey("crops.id", ondelete="CASCADE"), nullable=False
    )

    image_url: Mapped[str] = mapped_column(String(500), nullable=False)

    observed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    image_quality_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    status: Mapped[ObservationStatus] = mapped_column(
        String(50), default=ObservationStatus.SUBMITTED, nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    # Relationships
    farmer: Mapped["User"] = relationship(back_populates="observations")
    farm: Mapped["Farm"] = relationship(back_populates="observations")
    crop: Mapped["Crop"] = relationship(back_populates="observations")
