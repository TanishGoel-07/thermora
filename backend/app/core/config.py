"""
Central application configuration.
All values are overridable via environment variables / .env file.
"""
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "Thermora"
    ENV: str = "development"
    API_PREFIX: str = "/api"

    # Database
    DATABASE_URL: str = (
        "postgresql+psycopg2://thermora:thermora@postgres:5432/thermora"
    )

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # NASA POWER API
    NASA_POWER_BASE_URL: str = "https://power.larc.nasa.gov/api/temporal/daily/point"
    NASA_POWER_COMMUNITY: str = "AG"
    NASA_POWER_PARAMETERS: str = "T2M,T2M_MAX,T2M_MIN,RH2M,WS2M,ALLSKY_SFC_SW_DWN,PS,PRECTOTCORR"

    # Default AOI (Ghaziabad, India) used to seed districts/wards
    DEFAULT_LAT: float = 28.6692
    DEFAULT_LON: float = 77.4538

    # Thermal stress thresholds (HTSI 0-100)
    HTSI_SAFE_MAX: float = 30.0
    HTSI_CAUTION_MAX: float = 55.0
    HTSI_DANGER_MAX: float = 80.0
    # anything above HTSI_DANGER_MAX -> extreme danger

    # Alerting
    ALERT_RISK_THRESHOLD: float = 55.0  # HTSI score that triggers an alert
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""
    FCM_SERVER_KEY: str = ""

    # ML
    MODEL_DIR: str = "app/ml_models"
    RANDOM_SEED: int = 42

    # Auth
    SECRET_KEY: str = "change-me-in-production-thermora-secret"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24


@lru_cache
def get_settings() -> Settings:
    return Settings()
