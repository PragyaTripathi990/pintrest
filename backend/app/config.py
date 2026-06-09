from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", extra="ignore")

    app_name: str = "Pinterest Clone API"
    secret_key: str = "dev-secret-change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 43200  # 30 days

    database_url: str = f"sqlite:///{BASE_DIR / 'data' / 'pinterest.db'}"
    base_url: str = "http://localhost:8000"
    frontend_origin: str = "http://localhost:3000"

    upload_dir: Path = BASE_DIR / "uploads"

    @property
    def cors_origins(self) -> list[str]:
        return [self.frontend_origin, "http://localhost:3000", "http://127.0.0.1:3000"]


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    (BASE_DIR / "data").mkdir(parents=True, exist_ok=True)
    return settings


settings = get_settings()
