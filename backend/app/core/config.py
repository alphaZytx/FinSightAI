import json
from pathlib import Path

from pydantic_settings import BaseSettings


_ENV_FILE = Path(__file__).resolve().parent.parent.parent.parent / ".env"


class Settings(BaseSettings):
    APP_NAME: str = "FinSightAI"
    ENV: str = "development"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB: str = "finsight_ai"
    LLM_PROVIDER: str = "groq"
    LLM_API_KEY: str = "replace_me"
    GROQ_API_KEY: str = "replace_me"
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    EMBEDDING_MODEL: str = "text-embedding-model"
    UPLOAD_DIR: str = "storage/raw"
    REPORT_DIR: str = "storage/reports"
    CORS_ORIGINS_STR: str = "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175"

    @property
    def CORS_ORIGINS(self) -> list[str]:
        raw = self.CORS_ORIGINS_STR.strip()
        if raw.startswith("["):
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                pass
        return [item.strip() for item in raw.split(",") if item.strip()]

    class Config:
        env_file = str(_ENV_FILE) if _ENV_FILE.exists() else ".env"
        extra = "ignore"


settings = Settings()
