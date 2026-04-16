from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/groundstation"

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    redis_telemetry_channel: str = "telemetry"

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:80", "http://localhost"]

    # App metadata
    app_title: str = "Satellite Ground Station API"
    app_version: str = "1.0.0"
    debug: bool = False


settings = Settings()
