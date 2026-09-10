from datetime import datetime, UTC

from sqlalchemy import String, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class FarmSoilRecord(Base):
    __tablename__ = "farm_soil_records"

    id: Mapped[int] = mapped_column(primary_key=True)

    farm_id: Mapped[int] = mapped_column(
        ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, unique=True
    )

    # Soil Health Card identifiers & metadata
    sample_no: Mapped[str | None] = mapped_column(String(100), nullable=True)
    test_date: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Primary chemical parameters (ICAR Soil Health Card standard)
    ph: Mapped[float | None] = mapped_column(Float, nullable=True)
    ec: Mapped[float | None] = mapped_column(Float, nullable=True)  # dS/m
    oc: Mapped[float | None] = mapped_column(Float, nullable=True)  # Organic Carbon (%)
    nitrogen: Mapped[float | None] = mapped_column(Float, nullable=True)  # kg/ha
    phosphorus: Mapped[float | None] = mapped_column(Float, nullable=True)  # kg/ha
    potassium: Mapped[float | None] = mapped_column(Float, nullable=True)  # kg/ha
    sulphur: Mapped[float | None] = mapped_column(Float, nullable=True)  # ppm

    # Secondary / Micronutrients (ppm)
    zinc: Mapped[float | None] = mapped_column(Float, nullable=True)
    iron: Mapped[float | None] = mapped_column(Float, nullable=True)
    copper: Mapped[float | None] = mapped_column(Float, nullable=True)
    manganese: Mapped[float | None] = mapped_column(Float, nullable=True)
    boron: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Physical / Texture characteristics
    soil_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    texture: Mapped[str | None] = mapped_column(String(100), nullable=True)
    moisture: Mapped[float | None] = mapped_column(Float, nullable=True)

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
    farm: Mapped["Farm"] = relationship(back_populates="soil_record")
