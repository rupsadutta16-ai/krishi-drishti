from typing import List
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.database import get_db
from app.models.user import User
from jwt.exceptions import InvalidTokenError
from app.core.exceptions import AppException

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login"
)

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:

    try:
        payload = decode_token(token)

    except InvalidTokenError:
        raise AppException(
            status_code=401,
            message="Invalid or expired access token"
        )

    user_id = payload.get("sub")

    if not user_id:
        raise AppException(
            status_code=401,
            message="Invalid access token"
        )

    user = db.scalar(
        select(User).where(User.id == int(user_id))
    )

    if not user:
        raise AppException(
            status_code=401,
            message="User not found"
        )

    return user


def require_role(allowed_roles: List[str]):
    """
    Dependency factory that returns a FastAPI dependency checking user role.
    Usage: Depends(require_role(["expert"]))
    """
    def _check_role(current_user: User = Depends(get_current_user)) -> User:
        role_val = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
        if role_val not in allowed_roles and current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access restricted. Required roles: {allowed_roles}",
            )
        return current_user
    return _check_role