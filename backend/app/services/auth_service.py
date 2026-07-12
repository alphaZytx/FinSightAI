"""
Authentication service.

Handles:
- Password hashing / verification (bcrypt via passlib)
- JWT access-token creation and decoding
- High-level register / login business logic
"""

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.repositories.user_repository import user_repository
from app.schemas.user import TokenData, TokenResponse, UserInDB, UserPublic

# --------------------------------------------------------------------------- #
# Password hashing                                                             #
# --------------------------------------------------------------------------- #

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    if not hashed:
        return False
    try:
        return _pwd_context.verify(plain, hashed)
    except Exception:
        return False


# --------------------------------------------------------------------------- #
# JWT helpers                                                                  #
# --------------------------------------------------------------------------- #

def _make_token(data: dict, expires_delta: timedelta) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + expires_delta
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(user: UserInDB) -> str:
    return _make_token(
        {"sub": user.id, "email": user.email},
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def decode_access_token(token: str) -> TokenData:
    """Decode and validate a JWT; raises HTTP 401 on any failure."""
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: str | None = payload.get("sub")
        email: str | None = payload.get("email")
        if user_id is None:
            raise credentials_exc
        return TokenData(user_id=user_id, email=email)
    except JWTError:
        raise credentials_exc


# --------------------------------------------------------------------------- #
# Business logic                                                               #
# --------------------------------------------------------------------------- #

def _to_public(user: UserInDB) -> UserPublic:
    return UserPublic(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        created_at=user.created_at,
    )


async def register_user(email: str, full_name: str, password: str) -> TokenResponse:
    existing = await user_repository.find_by_email(email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    hashed = hash_password(password)
    user = await user_repository.create(email=email, full_name=full_name, hashed_password=hashed)
    token = create_access_token(user)
    return TokenResponse(access_token=token, user=_to_public(user))


async def login_user(email: str, password: str) -> TokenResponse:
    user = await user_repository.find_by_email(email)
    if user is None or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )

    token = create_access_token(user)
    return TokenResponse(access_token=token, user=_to_public(user))


async def get_current_user(token: str) -> UserPublic:
    token_data = decode_access_token(token)
    user = await user_repository.find_by_id(token_data.user_id)  # type: ignore[arg-type]
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return _to_public(user)
