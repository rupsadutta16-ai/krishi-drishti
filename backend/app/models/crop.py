from datetime import date, datetime, UTC

from sqlalchemy import String, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.enums.crop import CropType, GrowthStage


class Crop(Base):
    __tablename__ = "crops"

    id: Mapped[int] = mapped_column(primary_key=True)

    farm_id: Mapped[int] = mapped_column(
        ForeignKey("farms.id", ondelete="CASCADE"), nullable=False
    )

    crop_type: Mapped[CropType] = mapped_column(
        String(50), default=CropType.RICE, nullable=False
    )

    variety: Mapped[str | None] = mapped_column(String(100), nullable=True)

    sowing_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    growth_stage: Mapped[GrowthStage | None] = mapped_column(
        String(50), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    farm: Mapped["Farm"] = relationship(back_populates="crops")
    observations: Mapped[list["Observation"]] = relationship(
        back_populates="crop", cascade="all, delete-orphan"
    )

