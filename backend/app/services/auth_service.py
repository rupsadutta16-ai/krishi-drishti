from fastapi import status, Depends
from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserLogin,
    TokenResponse,
    RefreshTokenRequest,
    UserProfileUpdate,
    ChangePasswordRequest,
    FarmerProfileCreate,
    ExpertProfileCreate,
    OfficialProfileCreate,
)
from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.db.database import get_db
from app.models.user import User
from app.models.farmer_profile import FarmerProfile
from app.models.expert_profile import ExpertProfile
from app.models.official_profile import OfficialProfile
from app.core.exceptions import AppException
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_refresh_token,
)
from datetime import datetime, timedelta, timezone
from app.core.config import settings
from app.api.dependencies import get_current_user
from fastapi.security import OAuth2PasswordRequestForm

def register_user(
    user_data: UserCreate,
    db: Session
):
    username_exists = db.execute(
        select(User).where(User.username == user_data.username)
    ).scalar_one_or_none()

    if username_exists:
        raise AppException(
            message="Username already exists", status_code=status.HTTP_409_CONFLICT
        )

    email_exists = db.execute(
        select(User).where(User.email == user_data.email)
    ).scalar_one_or_none()

    if email_exists:
        raise AppException(
            message="Email already exists", status_code=status.HTTP_409_CONFLICT
        )

    # Map user-provided role to UserRole enum
    from app.models.user import UserRole
    raw_role = user_data.role.value if hasattr(user_data.role, "value") else str(user_data.role)
    raw_role = raw_role.lower().strip()
    role_map = {
        "farmer": UserRole.FARMER,
        "expert": UserRole.EXPERT,
        "official": UserRole.OFFICIAL,
    }
    assigned_role = role_map.get(raw_role, UserRole.FARMER)

    new_user = User(
        name=user_data.name,
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=assigned_role,
    )

    try:
        db.add(new_user)
        db.flush()

        if assigned_role == UserRole.FARMER:
            profile = FarmerProfile(
                user_id=new_user.id,
                preferred_language=user_data.preferred_language
            )
        elif assigned_role == UserRole.EXPERT:
            profile = ExpertProfile(user_id=new_user.id)
        else:
            profile = OfficialProfile(user_id=new_user.id)

        db.add(profile)
        db.commit()
        db.refresh(new_user)

    except IntegrityError as err:
        db.rollback()
        print("Database error:", str(err))
        raise
    return new_user

def login_user(form_data: OAuth2PasswordRequestForm, db: Session):
    user = db.execute(
        select(User).where(User.username == form_data.username)
    ).scalar_one_or_none()

    if not user:
        raise AppException(status_code=401, message="Invalid username or password")

    if not verify_password(form_data.password, user.password_hash):
        raise AppException(status_code=401, message="Invalid username or password")

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token()

    user.refresh_token = hash_refresh_token(refresh_token)
    user.refresh_token_expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
    )

    db.commit()

    role_val = user.role.value if hasattr(user.role, "value") else str(user.role)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": role_val,
    }

    
def refresh(token_data: RefreshTokenRequest,
    db: Session):
    
    if not token_data.refresh_token:
        raise AppException(
            status_code=401,
            message="Refresh token is required"
        )

    token_hash = hash_refresh_token(
        token_data.refresh_token
    )

    user = db.scalar(
        select(User).where(
            User.refresh_token == token_hash
        )
    )

    if not user:
        raise AppException(
            status_code=401,
            message="Invalid refresh token"
        )

    if not user.refresh_token_expires_at:
        raise AppException(
            status_code=401,
            message="Refresh token expiration is missing"
        )

    if user.refresh_token_expires_at <= datetime.now(timezone.utc):
        raise AppException(
            status_code=401,
            message="Refresh token expired"
        )

    access_token = create_access_token(user.id)

    return {
        "access_token": access_token,
        "refresh_token": token_data.refresh_token,
        "token_type": "bearer",
    }

def update_user_profile(
    user_data: UserProfileUpdate,
    current_user: User,
    db: Session
):
    
    if user_data.name is not None:
        name = user_data.name.strip()

        if not name:
            raise AppException(
                status_code=400,
                message="Name cannot be empty"
            )

        current_user.name = name

    db.commit()
    db.refresh(current_user)

    return current_user

def change_user_password(password_data: ChangePasswordRequest,
    current_user: User,
    db: Session):
    if not verify_password(
        password_data.current_password,
        current_user.password_hash
    ):
        raise AppException(
            status_code=401,
            message="Current password is incorrect"
        )

    if password_data.current_password == password_data.new_password:
        raise AppException(
            status_code=400,
            message="New password must be different from current password"
        )

    try:
        current_user.password_hash = hash_password(
            password_data.new_password
        )

        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "message": "Password changed successfully"
    }
    
def logout_user(
    current_user: User,
    db: Session
):
    try:
        current_user.refresh_token = None
        current_user.refresh_token_expires_at = None

        db.commit()
        
    except Exception:
            db.rollback()
            raise
        
    return {
        "message": "Logged out successfully"
    }

def update_farmer_profile(
    profile_data: FarmerProfileCreate,
    current_user: User,
    db: Session
):
    if current_user.role != "farmer":
        raise AppException(
            status_code=403,
            message="Only farmers can update farmer profile"
        )

    profile = current_user.farmer_profile
    if not profile:
        profile = FarmerProfile(user_id=current_user.id)
        db.add(profile)
        db.flush()

    if profile_data.phone is not None:
        profile.phone = profile_data.phone
    if profile_data.preferred_language is not None:
        profile.preferred_language = profile_data.preferred_language
    if profile_data.village is not None:
        profile.village = profile_data.village
    if profile_data.district is not None:
        profile.district = profile_data.district
    if profile_data.state is not None:
        profile.state = profile_data.state

    db.commit()
    db.refresh(profile)
    return profile

def update_expert_profile(
    profile_data: ExpertProfileCreate,
    current_user: User,
    db: Session
):
    if current_user.role != "expert":
        raise AppException(
            status_code=403,
            message="Only experts can update expert profile"
        )

    profile = current_user.expert_profile
    if not profile:
        profile = ExpertProfile(user_id=current_user.id)
        db.add(profile)
        db.flush()

    if profile_data.specialization is not None:
        profile.specialization = profile_data.specialization
    if profile_data.qualification is not None:
        profile.qualification = profile_data.qualification
    if profile_data.organization is not None:
        profile.organization = profile_data.organization
    if profile_data.phone is not None:
        profile.phone = profile_data.phone
    if profile_data.address is not None:
        profile.address = profile_data.address
    if profile_data.is_verified is not None:
        profile.is_verified = profile_data.is_verified

    db.commit()
    db.refresh(profile)
    return profile

def update_official_profile(
    profile_data: OfficialProfileCreate,
    current_user: User,
    db: Session
):
    if current_user.role != "official":
        raise AppException(
            status_code=403,
            message="Only officials can update official profile"
        )

    profile = current_user.official_profile
    if not profile:
        profile = OfficialProfile(user_id=current_user.id)
        db.add(profile)
        db.flush()

    if profile_data.department is not None:
        profile.department = profile_data.department
    if profile_data.designation is not None:
        profile.designation = profile_data.designation
    if profile_data.district is not None:
        profile.district = profile_data.district
    if profile_data.state is not None:
        profile.state = profile_data.state

    db.commit()
    db.refresh(profile)
    return profile

def upload_expert_verification_doc(
    file,
    current_user,
    db,
):
    """Upload an expert verification document (image or PDF) to Cloudinary."""
    from app.utils.media import upload_document, delete_asset
    from app.core.exceptions import AppException
    from app.models.expert_profile import ExpertProfile

    if current_user.role != "expert":
        raise AppException(
            status_code=403,
            message="Only experts can upload a verification document",
        )

    profile = current_user.expert_profile
    if not profile:
        profile = ExpertProfile(user_id=current_user.id)
        db.add(profile)
        db.flush()

    if profile.verification_doc_public_id:
        try:
            delete_asset(profile.verification_doc_public_id, resource_type="raw")
        except Exception:
            pass

    result = upload_document(file, folder="krishi_drishti/verification_docs")
    profile.verification_doc_url = result["secure_url"]
    profile.verification_doc_public_id = result["public_id"]

    db.commit()
    db.refresh(profile)
    return profile
