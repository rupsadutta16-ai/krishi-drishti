from datetime import datetime, UTC

from sqlalchemy import Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class SensorObservation(Base):
    __tablename__ = "sensor_observations"

    id: Mapped[int] = mapped_column(primary_key=True)

    observation_id: Mapped[int] = mapped_column(
        ForeignKey("observations.id", ondelete="CASCADE"), nullable=False
    )

    temperature: Mapped[float] = mapped_column(Float, nullable=False)

    humidity: Mapped[float] = mapped_column(Float, nullable=False)

    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    # Relationships
    observation: Mapped["Observation"] = relationship(
        back_populates="sensor_observations"
    )
