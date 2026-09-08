from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.database import get_db
from app.models.user import User
from jwt.exceptions import InvalidTokenError
from app.core.exception_handlers import AppException

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