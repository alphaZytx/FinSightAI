from app.core.config import settings


class MissingMongoCollection:
    def __getattr__(self, name: str):
        raise RuntimeError("MongoDB support requires the 'motor' package. Install backend requirements before using database-backed features.")


class MissingMongoDatabase:
    def __getitem__(self, name: str) -> MissingMongoCollection:
        return MissingMongoCollection()


try:
    from motor.motor_asyncio import AsyncIOMotorClient
except ModuleNotFoundError:
    client = None
    db = MissingMongoDatabase()
else:
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB]


def get_db():
    return db