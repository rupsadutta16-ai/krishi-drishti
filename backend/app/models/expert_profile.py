from datetime import datetime, UTC

from sqlalchemy import String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class ExpertProfile(Base):
    __tablename__ = "expert_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, unique=True
    )

    specialization: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )

    qualification: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )

    organization: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )

    # Contact & location details
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Verification document (PDF or image uploaded to Cloudinary)
    verification_doc_url: Mapped[str | None] = mapped_column(
        String(1024), nullable=True
    )
    verification_doc_public_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )

    is_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
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

    user: Mapped["User"] = relationship(back_populates="expert_profile")
