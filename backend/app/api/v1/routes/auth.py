from fastapi import APIRouter, Depends

from app.api.v1.deps import get_current_user
from app.schemas.user import TokenResponse, UserLogin, UserPublic, UserRegister
from app.services.auth_service import login_user, register_user

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: UserRegister):
    """
    Create a new user account and return a JWT access token.
    Raises 409 if the email is already registered.
    """
    return await register_user(
        email=body.email,
        full_name=body.full_name,
        password=body.password,
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin):
    """
    Authenticate with email + password and return a JWT access token.
    Raises 401 on bad credentials.
    """
    return await login_user(email=body.email, password=body.password)


@router.get("/me", response_model=UserPublic)
async def me(current_user: UserPublic = Depends(get_current_user)):
    """Return the profile of the currently authenticated user."""
    return current_user
