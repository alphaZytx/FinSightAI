from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.api.v1.deps import get_current_user
from app.schemas.user import TokenResponse, UserLogin, UserPublic, UserRegister
from app.services.auth_service import (
    login_user,
    register_user,
    google_login_user,
    generate_password_reset_token,
    verify_password_reset_token,
)
from app.repositories.user_repository import user_repository
from app.services.auth_service import hash_password
from app.services.email_service import send_password_reset_email

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


class GoogleLoginRequest(BaseModel):
    token: str

@router.post("/google", response_model=TokenResponse)
async def google_login(body: GoogleLoginRequest):
    """
    Authenticate with a Google ID token and return a JWT access token.
    """
    return await google_login_user(token=body.token)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr

@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    """
    Generate a password reset token and send an email.
    """
    user = await user_repository.find_by_email(body.email)
    if user:
        token = generate_password_reset_token(body.email)
        try:
            await send_password_reset_email(body.email, token)
        except Exception as e:
            print(f"Failed to send email to {body.email}: {e}")
    return {"message": "If an account with that email exists, we sent a password reset link."}


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    """
    Reset password using a valid token.
    """
    email = verify_password_reset_token(body.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token."
        )
    
    user = await user_repository.find_by_email(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    
    hashed = hash_password(body.new_password)
    success = await user_repository.update_password(user.id, hashed)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update password."
        )
    
    return {"message": "Password successfully reset."}
