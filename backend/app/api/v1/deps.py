"""
FastAPI dependency injection helpers.

Usage in any route:

    from app.api.v1.deps import get_current_user
    from app.schemas.user import UserPublic

    @router.get("/protected")
    async def protected(user: UserPublic = Depends(get_current_user)):
        ...
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.schemas.user import UserPublic
from app.services.auth_service import get_current_user as _get_current_user

_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> UserPublic:
    """
    Extract and validate the Bearer token from the Authorization header.
    Raises HTTP 401 if the token is missing, malformed, or invalid.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return await _get_current_user(credentials.credentials)
