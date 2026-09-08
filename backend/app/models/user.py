from datetime import datetime, UTC
from enum import Enum

from sqlalchemy import String, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class UserRole(str, Enum):
    FARMER = "farmer"
    EXPERT = "expert"
    OFFICIAL = "official"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(String(50), nullable=False)

    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)

    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    role: Mapped[UserRole] = mapped_column(
        String(50), nullable=False
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
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

    farmer_profile: Mapped["FarmerProfile"] = relationship(
        back_populates="user", uselist=False
    )
    expert_profile: Mapped["ExpertProfile"] = relationship(
        back_populates="user", uselist=False
    )
    official_profile: Mapped["OfficialProfile"] = relationship(
        back_populates="user", uselist=False
    )

    farms: Mapped[list["Farm"]] = relationship(
        back_populates="farmer"
    )

    refresh_token: Mapped[str | None] = mapped_column(nullable=True)
    refresh_token_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
