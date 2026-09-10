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


# ──────────────────────────────────────────────────────────────────
# Role Profile Response Schemas
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


class ExpertProfileResponse(BaseModel):
    id: int
    user_id: int
    specialization: str | None
    qualification: str | None
    organization: str | None
    phone: str | None = None
    address: str | None = None
    verification_doc_url: str | None = None
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExpertPublicProfileResponse(BaseModel):
    """Safe public view of an expert — no email or sensitive data."""
    id: int          # user id
    name: str
    username: str
    specialization: str | None
    qualification: str | None
    organization: str | None
    phone: str | None
    address: str | None
    is_verified: bool

    model_config = {"from_attributes": True}


class FarmerPublicProfileResponse(BaseModel):
    """Safe public view of a farmer — visible to experts reviewing their cases."""
    id: int          # user id
    name: str
    username: str
    email: str | None = None
    phone: str | None = None
    village: str | None = None
    district: str | None = None
    state: str | None = None
    preferred_language: str | None = None

    model_config = {"from_attributes": True}


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


# ──────────────────────────────────────────────────────────────────
# User Schemas
# ──────────────────────────────────────────────────────────────────

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

    role: UserRole = UserRole.FARMER
    preferred_language: SupportedLanguage | None = None


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

    farmer_profile: FarmerProfileResponse | None = None
    expert_profile: ExpertProfileResponse | None = None
    official_profile: OfficialProfileResponse | None = None

    model_config = {
        "from_attributes": True
    }


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    role: str | None = None



class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(
        default=None,
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
# Role Profile Create/Update Schemas
# ──────────────────────────────────────────────────────────────────

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


class ExpertProfileCreate(BaseModel):
    specialization: ExpertSpecialization | None = None
    qualification: str | None = Field(default=None, max_length=255)
    organization: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=20)
    address: str | None = Field(default=None, max_length=255)
    is_verified: bool | None = None


class OfficialProfileCreate(BaseModel):
    department: OfficialDepartment | None = None
    designation: OfficialDesignation | None = None
    state: IndianState | None = None
    district: str | None = None

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