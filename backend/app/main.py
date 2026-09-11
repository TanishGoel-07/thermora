from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler

from app.core.config import get_settings
from app.database import init_db, SessionLocal
from app.routers import (
    dashboard,
    thermal,
    forecast,
    alerts,
    gis,
    hospitals,
    cooling_centers,
    weather,
    geography,
    health_guidance,
    settings_router,
    auth,
    citizen_risk,
    explainability,
    government,
    uhi,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("thermora")

settings = get_settings()

app = FastAPI(
    title="Thermora API",
    description="AI-Powered Heatwave Early Warning & Human Thermal Stress Intelligence Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix=settings.API_PREFIX)
app.include_router(thermal.router, prefix=settings.API_PREFIX)
app.include_router(forecast.router, prefix=settings.API_PREFIX)
app.include_router(alerts.router, prefix=settings.API_PREFIX)
app.include_router(gis.router, prefix=settings.API_PREFIX)
app.include_router(hospitals.router, prefix=settings.API_PREFIX)
app.include_router(cooling_centers.router, prefix=settings.API_PREFIX)
app.include_router(weather.router, prefix=settings.API_PREFIX)
app.include_router(geography.router, prefix=settings.API_PREFIX)
app.include_router(health_guidance.router, prefix=settings.API_PREFIX)
app.include_router(settings_router.router, prefix=settings.API_PREFIX)
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(citizen_risk.router, prefix=settings.API_PREFIX)
app.include_router(explainability.router, prefix=settings.API_PREFIX)
app.include_router(government.router, prefix=settings.API_PREFIX)
app.include_router(uhi.router, prefix=settings.API_PREFIX)

scheduler = BackgroundScheduler()


def _refresh_all_wards_job() -> None:
    """Periodic job: recompute HTSI for every ward from its latest weather row."""
    from app.models.geography import Ward
    from app.models.weather import WeatherObservation
    from app.models.thermal import ThermalStressRecord
    from app.services.thermal_stress import compute_htsi
    from app.alerts.alert_engine import maybe_create_alert
    from sqlalchemy import select, desc
    from datetime import datetime

    db = SessionLocal()
    try:
        wards = db.query(Ward).all()
        for ward in wards:
            weather_row = (
                db.execute(
                    select(WeatherObservation)
                    .where(WeatherObservation.ward_id == ward.id)
                    .order_by(desc(WeatherObservation.observed_date))
                    .limit(1)
                )
                .scalars()
                .first()
            )
            if not weather_row:
                continue
            result = compute_htsi(
                temperature_c=weather_row.temperature_c,
                humidity_pct=weather_row.humidity_pct,
                wind_speed_ms=weather_row.wind_speed_ms,
                solar_radiation_wm2=weather_row.solar_radiation_wm2,
            )
            record = ThermalStressRecord(
                ward_id=ward.id,
                weather_observation_id=weather_row.id,
                recorded_at=datetime.utcnow(),
                heat_index_c=result.heat_index_c,
                wbgt_c=result.wbgt_c,
                utci_c=result.utci_c,
                htsi_score=result.htsi_score,
                htsi_category=result.htsi_category,
                contrib_temperature=result.contrib_temperature,
                contrib_humidity=result.contrib_humidity,
                contrib_wind=result.contrib_wind,
                contrib_solar_radiation=result.contrib_solar_radiation,
                contrib_personal_vulnerability=result.contrib_personal_vulnerability,
                recommendation=result.recommendation,
            )
            db.add(record)
            maybe_create_alert(db, ward.id, result.htsi_score, result.htsi_category, result.recommendation)
        db.commit()
        logger.info("Refreshed HTSI for %d wards", len(wards))
    finally:
        db.close()


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    scheduler.add_job(_refresh_all_wards_job, "interval", minutes=30, id="refresh_htsi")
    scheduler.start()
    logger.info("Thermora API started.")


@app.on_event("shutdown")
def on_shutdown() -> None:
    scheduler.shutdown(wait=False)


@app.get("/")
def root():
    return {"service": settings.APP_NAME, "status": "online", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
