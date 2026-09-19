# backend/app/core/config.py
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    """
    Application environment configuration and settings validator.
    """
    API_PREFIX: str = "/api"
    DEBUG: bool = False
    DATABASE_URL: str
    SYNC_DATABASE_URL: str
    ALLOWED_ORIGINS: Union[str, List[str]]
    GOOGLE_API_KEY: str

    JWT_SECRET: str = "hf;ksdajfsdfhiosufwernh"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 24 * 60

    @field_validator("ALLOWED_ORIGINS")
    def validate_allowed_origins(cls, value: Union[str, List[str]]) -> List[str]:
        if isinstance(value, list):
            return value
        if not value:
            raise ValueError("ALLOWED_ORIGINS is required")
        return [origin.strip() for origin in value.split(",") if origin.strip()]

    @field_validator("GOOGLE_API_KEY")
    def validate_google_api_key(cls, value: str) -> str:
        if not value:
            raise ValueError("GOOGLE_API_KEY is required")
        return value

    model_config = SettingsConfigDict(
        env_file=[
            str(BASE_DIR / "env" / "backend.env"),
            str(BASE_DIR / "env" / "db.env")
        ],
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()