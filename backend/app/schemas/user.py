from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field, ConfigDict, model_validator

from app.enums.locations import IndianState, is_valid_district_for_state
from app.enums.profile import (
    SupportedLanguage,
    ExpertSpecialization,
    OfficialDepartment,
    OfficialDesignation,
)


class UserRole(str, Enum):
    FARMER = "farmer"
    EXPERT = "expert"
    OFFICIAL = "official"


class UserCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=50
    )

    username: str = Field(
        min_length=3,
        max_length=50
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128
    )

    # Role is always forced to FARMER during normal public registration.
    # The field is kept so internal/admin flows can still override it,
    # but the register_user service enforces FARMER for public callers.
    role: UserRole = UserRole.FARMER

class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    username: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }
    
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    
class RefreshTokenRequest(BaseModel):
    refresh_token: str
    
class UserProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    
    name: str | None = Field(
        ...,
        min_length=2,
        max_length=50
    )
    
class ChangePasswordRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    current_password: str = Field(
        ...,
        min_length=8
    )

    new_password: str = Field(
        ...,
        min_length=8
    )


# ──────────────────────────────────────────────────────────────────
# Farmer Profile
# ──────────────────────────────────────────────────────────────────

class FarmerProfileResponse(BaseModel):
    id: int
    user_id: int
    phone: str | None
    preferred_language: str | None
    village: str | None
    district: str | None
    state: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FarmerProfileCreate(BaseModel):
    phone: str | None = None
    preferred_language: SupportedLanguage | None = None
    village: str | None = None
    district: str | None = None
    state: IndianState | None = None

    @model_validator(mode="after")
    def validate_district_belongs_to_state(self):
        """Ensure the submitted district is valid for the submitted state."""
        if self.district is not None:
            if self.state is None:
                raise ValueError(
                    "A state must be selected before choosing a district."
                )
            if not is_valid_district_for_state(self.state.value, self.district):
                raise ValueError(
                    f"'{self.district}' is not a valid district of {self.state.value}. "
                    f"Please choose a valid district."
                )
        return self


# ──────────────────────────────────────────────────────────────────
# Expert Profile  — all fields mandatory (no None)
# ──────────────────────────────────────────────────────────────────

class ExpertProfileResponse(BaseModel):
    id: int
    user_id: int
    specialization: str | None
    qualification: str | None
    organization: str | None
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExpertProfileCreate(BaseModel):
    specialization: ExpertSpecialization
    qualification: str = Field(min_length=1, max_length=255)
    organization: str = Field(min_length=1, max_length=255)
    is_verified: bool = False


# ──────────────────────────────────────────────────────────────────
# Official Profile  — all fields mandatory (no None)
# ──────────────────────────────────────────────────────────────────

class OfficialProfileResponse(BaseModel):
    id: int
    user_id: int
    department: str | None
    designation: str | None
    district: str | None
    state: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OfficialProfileCreate(BaseModel):
    department: OfficialDepartment
    designation: OfficialDesignation
    state: IndianState
    district: str

    @model_validator(mode="after")
    def validate_district_belongs_to_state(self):
        """Ensure the submitted district is valid for the submitted state."""
        if not is_valid_district_for_state(self.state.value, self.district):
            raise ValueError(
                f"'{self.district}' is not a valid district of {self.state.value}. "
                f"Please choose a valid district."
            )
        return self