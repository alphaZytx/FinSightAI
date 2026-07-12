from app.core.config import settings
from app.schemas.user import UserRegister, TokenResponse, UserInDB
from app.repositories.user_repository import user_repository
from app.services.auth_service import hash_password, verify_password, create_access_token, decode_access_token
from app.api.v1.routes.auth import router
from app.api.v1.deps import get_current_user
from datetime import datetime

# Password hashing round-trip
h = hash_password("TestPass123!")
assert verify_password("TestPass123!", h), "verify failed"
assert not verify_password("WrongPass", h), "should not verify wrong password"

# JWT round-trip
fake_user = UserInDB(**{
    "_id": "507f1f77bcf86cd799439011",
    "email": "test@example.com",
    "full_name": "Test User",
    "hashed_password": h,
    "is_active": True,
    "created_at": datetime.utcnow(),
    "updated_at": datetime.utcnow(),
})
token = create_access_token(fake_user)
token_data = decode_access_token(token)
assert token_data.user_id == "507f1f77bcf86cd799439011"
assert token_data.email == "test@example.com"

print("All smoke tests passed")
print(f"  JWT_SECRET_KEY set: {bool(settings.JWT_SECRET_KEY)}")
print(f"  ACCESS_TOKEN_EXPIRE_MINUTES: {settings.ACCESS_TOKEN_EXPIRE_MINUTES}")
