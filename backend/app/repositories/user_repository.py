from datetime import datetime, timezone

from bson import ObjectId

from app.repositories.base import BaseRepository
from app.schemas.user import UserInDB


class UserRepository(BaseRepository):
    collection_name = "users"

    # ------------------------------------------------------------------ #
    # Reads                                                                #
    # ------------------------------------------------------------------ #

    async def find_by_email(self, email: str) -> UserInDB | None:
        doc = await self.collection.find_one({"email": email.lower().strip()})
        return self._to_model(doc)

    async def find_by_id(self, user_id: str) -> UserInDB | None:
        try:
            oid = ObjectId(user_id)
        except Exception:
            return None
        doc = await self.collection.find_one({"_id": oid})
        return self._to_model(doc)

    # ------------------------------------------------------------------ #
    # Writes                                                               #
    # ------------------------------------------------------------------ #

    async def create(self, email: str, full_name: str, hashed_password: str) -> UserInDB:
        now = datetime.now(timezone.utc)
        doc = {
            "email": email.lower().strip(),
            "full_name": full_name.strip(),
            "hashed_password": hashed_password,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }
        result = await self.collection.insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        return UserInDB(**doc)

    async def update_password(self, user_id: str, hashed_password: str) -> bool:
        try:
            oid = ObjectId(user_id)
        except Exception:
            return False
        result = await self.collection.update_one(
            {"_id": oid},
            {"$set": {"hashed_password": hashed_password, "updated_at": datetime.now(timezone.utc)}},
        )
        return result.modified_count == 1

    # ------------------------------------------------------------------ #
    # Helpers                                                              #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _to_model(doc: dict | None) -> UserInDB | None:
        if doc is None:
            return None
        doc["_id"] = str(doc["_id"])
        return UserInDB(**doc)


# Singleton instance used throughout the app
user_repository = UserRepository()
