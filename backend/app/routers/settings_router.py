from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import get_settings

router = APIRouter(prefix="/settings", tags=["settings"])
settings = get_settings()


class ThresholdSettings(BaseModel):
    htsi_safe_max: float
    htsi_caution_max: float
    htsi_danger_max: float
    alert_risk_threshold: float


@router.get("/thresholds", response_model=ThresholdSettings)
def get_thresholds():
    return ThresholdSettings(
        htsi_safe_max=settings.HTSI_SAFE_MAX,
        htsi_caution_max=settings.HTSI_CAUTION_MAX,
        htsi_danger_max=settings.HTSI_DANGER_MAX,
        alert_risk_threshold=settings.ALERT_RISK_THRESHOLD,
    )


@router.get("/system-info")
def get_system_info():
    return {
        "app_name": settings.APP_NAME,
        "environment": settings.ENV,
        "nasa_power_parameters": settings.NASA_POWER_PARAMETERS,
        "default_location": {"lat": settings.DEFAULT_LAT, "lon": settings.DEFAULT_LON},
    }
