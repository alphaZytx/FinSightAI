from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, EmailStr, Field, StringConstraints


# --------------------------------------------------------------------------- #
# Stored in MongoDB                                                            #
# --------------------------------------------------------------------------- #

class UserInDB(BaseModel):
    """Full user document as stored in MongoDB (never sent to the client)."""

    id: str = Field(alias="_id")
    email: EmailStr
    full_name: str = ""
    hashed_password: str | None = None
    auth_provider: str = "local"
    google_id: str | None = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True}


# --------------------------------------------------------------------------- #
# Request bodies                                                               #
# --------------------------------------------------------------------------- #

class UserRegister(BaseModel):
    email: EmailStr
    full_name: Annotated[str, StringConstraints(min_length=2, strip_whitespace=True)]
    password: Annotated[str, StringConstraints(min_length=8)]


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# --------------------------------------------------------------------------- #
# Response / public shapes                                                     #
# --------------------------------------------------------------------------- #

class UserPublic(BaseModel):
    """Safe user representation returned to clients."""

    id: str
    email: EmailStr
    full_name: str
    is_active: bool
    created_at: datetime


# --------------------------------------------------------------------------- #
# Token shapes                                                                 #
# --------------------------------------------------------------------------- #

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class TokenData(BaseModel):
    """Claims extracted from a decoded JWT."""

    user_id: str | None = None
    email: str | None = None
