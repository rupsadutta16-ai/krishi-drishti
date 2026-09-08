from fastapi import APIRouter, status, Depends
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
    FarmerProfileResponse,
    ExpertProfileResponse,
    OfficialProfileResponse,
)
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User

from app.api.dependencies import get_current_user
from fastapi.security import OAuth2PasswordRequestForm
from app.services.auth_service import (
    register_user,
    login_user,
    refresh,
    update_user_profile,
    change_user_password,
    logout_user,
    update_farmer_profile,
    update_expert_profile,
    update_official_profile,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    return register_user(user_data, db)
    

@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    return login_user(form_data, db)

@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK
)
def refresh_access_token(
    token_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    return refresh(token_data, db)
    
    
@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    return current_user

@router.patch(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK
)
def update_profile(
    user_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return update_user_profile(user_data, current_user, db)
    


@router.patch(
    "/change-password",
    status_code=status.HTTP_200_OK
)
def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return change_user_password(password_data, current_user, db)

@router.patch(
    "/logout",
    status_code=status.HTTP_200_OK
)
def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return logout_user(current_user, db)

@router.patch(
    "/profile/farmer",
    response_model=FarmerProfileResponse,
    status_code=status.HTTP_200_OK
)
def update_farmer_profile_route(
    profile_data: FarmerProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return update_farmer_profile(profile_data, current_user, db)

@router.patch(
    "/profile/expert",
    response_model=ExpertProfileResponse,
    status_code=status.HTTP_200_OK
)
def update_expert_profile_route(
    profile_data: ExpertProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return update_expert_profile(profile_data, current_user, db)

@router.patch(
    "/profile/official",
    response_model=OfficialProfileResponse,
    status_code=status.HTTP_200_OK
)
def update_official_profile_route(
    profile_data: OfficialProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return update_official_profile(profile_data, current_user, db)