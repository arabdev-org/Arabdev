"""Application settings, loaded from environment variables and `backend/.env`."""

from functools import lru_cache
from pathlib import Path
from typing import Annotated, Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]

_INSECURE_DEFAULT_SECRET = "dev-only-insecure-secret-change-me-0123456789"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "ArabDev API"
    environment: Literal["development", "production", "test"] = "development"
    api_v1_prefix: str = "/api/v1"

    # SQLite database file. Defaults to backend/arabdev.db.
    database_url: str = "sqlite:///" + (BASE_DIR / "arabdev.db").as_posix()
    database_echo: bool = False

    # Optional. When unset, rate limiting and caching fall back to in-process memory.
    redis_url: str | None = None

    secret_key: str = _INSECURE_DEFAULT_SECRET
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30
    refresh_token_session_hours: int = 12
    refresh_reuse_grace_seconds: int = 20
    password_reset_expire_minutes: int = 30

    refresh_cookie_name: str = "arabdev_refresh"
    cookie_secure: bool = False
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"

    cors_origins: Annotated[list[str], NoDecode] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    # Public address of the app, used in emails. Production: https://arabdev.site
    frontend_url: str = "http://localhost:5173"
    support_email: str = "support@arabdev.site"
    hello_email: str = "hi@arabdev.site"
    # Sender of outgoing emails, once a mail provider is connected.
    mail_from: str = "ArabDev <support@arabdev.site>"

    storage_backend: Literal["local"] = "local"
    media_root: Path = BASE_DIR / "media"
    media_url: str = "/media"
    max_upload_bytes: int = 5 * 1024 * 1024

    rate_limit_enabled: bool = True

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @model_validator(mode="after")
    def _check_production_secret(self) -> "Settings":
        if self.environment == "production" and self.secret_key == _INSECURE_DEFAULT_SECRET:
            raise ValueError("SECRET_KEY must be set in production")
        return self

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
