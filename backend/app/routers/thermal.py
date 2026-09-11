from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.database import get_db
from app.models.geography import Ward
from app.models.weather import WeatherObservation
from app.models.thermal import ThermalStressRecord
from app.schemas.schemas import ThermalStressInput, ThermalStressOut, RiskDriverOut
from app.services.thermal_stress import compute_htsi, risk_drivers
from app.alerts.alert_engine import maybe_create_alert

router = APIRouter(prefix="/thermal", tags=["thermal-stress"])


@router.post("/compute", response_model=ThermalStressOut)
def compute_thermal_stress(payload: ThermalStressInput):
    """Ad-hoc HTSI computation from raw weather + personal-vulnerability inputs."""
    result = compute_htsi(
        temperature_c=payload.temperature_c,
        humidity_pct=payload.humidity_pct,
        wind_speed_ms=payload.wind_speed_ms,
        solar_radiation_wm2=payload.solar_radiation_wm2,
        age=payload.age,
        occupation=payload.occupation,
        has_chronic_condition=payload.has_chronic_condition,
        outdoor_worker=payload.outdoor_worker,
    )
    return ThermalStressOut(**result.__dict__)


@router.get("/ward/{ward_id}/latest", response_model=ThermalStressOut)
def get_latest_ward_thermal_stress(ward_id: int, db: Session = Depends(get_db)):
    record = (
        db.execute(
            select(ThermalStressRecord)
            .where(ThermalStressRecord.ward_id == ward_id)
            .order_by(desc(ThermalStressRecord.recorded_at))
            .limit(1)
        )
        .scalars()
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="No thermal stress record found for this ward")
    return ThermalStressOut(
        heat_index_c=record.heat_index_c,
        wbgt_c=record.wbgt_c,
        utci_c=record.utci_c,
        htsi_score=record.htsi_score,
        htsi_category=record.htsi_category,
        contrib_temperature=record.contrib_temperature,
        contrib_humidity=record.contrib_humidity,
        contrib_wind=record.contrib_wind,
        contrib_solar_radiation=record.contrib_solar_radiation,
        contrib_personal_vulnerability=record.contrib_personal_vulnerability,
        recommendation=record.recommendation,
    )


@router.post("/ward/{ward_id}/refresh", response_model=ThermalStressOut)
def refresh_ward_thermal_stress(ward_id: int, db: Session = Depends(get_db)):
    """Pulls latest weather observation for the ward, recomputes HTSI, stores it, and triggers alerts."""
    ward = db.get(Ward, ward_id)
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")

    weather = (
        db.execute(
            select(WeatherObservation)
            .where(WeatherObservation.ward_id == ward_id)
            .order_by(desc(WeatherObservation.observed_date))
            .limit(1)
        )
        .scalars()
        .first()
    )
    if not weather:
        raise HTTPException(status_code=404, detail="No weather data available for this ward")

    result = compute_htsi(
        temperature_c=weather.temperature_c,
        humidity_pct=weather.humidity_pct,
        wind_speed_ms=weather.wind_speed_ms,
        solar_radiation_wm2=weather.solar_radiation_wm2,
    )

    record = ThermalStressRecord(
        ward_id=ward_id,
        weather_observation_id=weather.id,
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
    db.commit()

    maybe_create_alert(db, ward_id, result.htsi_score, result.htsi_category, result.recommendation)

    return ThermalStressOut(**result.__dict__)


@router.get("/ward/{ward_id}/breakdown", response_model=list[RiskDriverOut])
def get_thermal_breakdown(ward_id: int, db: Session = Depends(get_db)):
    record = (
        db.execute(
            select(ThermalStressRecord)
            .where(ThermalStressRecord.ward_id == ward_id)
            .order_by(desc(ThermalStressRecord.recorded_at))
            .limit(1)
        )
        .scalars()
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="No thermal stress record found for this ward")

    from app.services.thermal_stress import HTSIResult

    result = HTSIResult(
        heat_index_c=record.heat_index_c,
        wbgt_c=record.wbgt_c,
        utci_c=record.utci_c,
        htsi_score=record.htsi_score,
        htsi_category=record.htsi_category,
        contrib_temperature=record.contrib_temperature,
        contrib_humidity=record.contrib_humidity,
        contrib_wind=record.contrib_wind,
        contrib_solar_radiation=record.contrib_solar_radiation,
        contrib_personal_vulnerability=record.contrib_personal_vulnerability,
        recommendation=record.recommendation,
    )
    return [RiskDriverOut(**d) for d in risk_drivers(result)]
