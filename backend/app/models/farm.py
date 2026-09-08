from datetime import datetime, UTC

from sqlalchemy import String, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Farm(Base):
    __tablename__ = "farms"

    id: Mapped[int] = mapped_column(primary_key=True)

    farmer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )

    farm_name: Mapped[str] = mapped_column(String(100), nullable=False)

    area_acres: Mapped[float | None] = mapped_column(Float, nullable=True)

    village: Mapped[str | None] = mapped_column(String(100), nullable=True)

    district: Mapped[str | None] = mapped_column(String(100), nullable=True)

    state: Mapped[str | None] = mapped_column(String(100), nullable=True)

    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

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
    farmer: Mapped["User"] = relationship(back_populates="farms")
    crops: Mapped[list["Crop"]] = relationship(
        back_populates="farm", cascade="all, delete-orphan"
    )
    observations: Mapped[list["Observation"]] = relationship(
        back_populates="farm", cascade="all, delete-orphan"
    )


