from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.database import get_db
from app.models.weather import WeatherObservation
from app.schemas.schemas import CitizenRiskInput, CitizenRiskOut
from app.services.citizen_risk import assess_citizen_risk

router = APIRouter(prefix="/citizen", tags=["citizen-risk"])


@router.post("/risk-assessment", response_model=CitizenRiskOut)
def get_citizen_risk_assessment(payload: CitizenRiskInput, db: Session = Depends(get_db)):
    """
    Personalized heat risk assessment (Feature 1). If temperature/humidity
    aren't supplied directly, the latest observation for `ward_id` is used —
    this lets the frontend call this endpoint with just a profile + ward.
    """
    temperature_c = payload.temperature_c
    humidity_pct = payload.humidity_pct
    wind_speed_ms = payload.wind_speed_ms
    solar_radiation_wm2 = payload.solar_radiation_wm2

    if temperature_c is None or humidity_pct is None:
        if payload.ward_id is None:
            raise HTTPException(
                status_code=400,
                detail="Provide either temperature_c/humidity_pct or a ward_id to look up current weather.",
            )
        weather = (
            db.execute(
                select(WeatherObservation)
                .where(WeatherObservation.ward_id == payload.ward_id)
                .order_by(desc(WeatherObservation.observed_date))
                .limit(1)
            )
            .scalars()
            .first()
        )
        if not weather:
            raise HTTPException(status_code=404, detail="No weather data available for this ward")
        temperature_c = weather.temperature_c
        humidity_pct = weather.humidity_pct
        wind_speed_ms = weather.wind_speed_ms
        solar_radiation_wm2 = weather.solar_radiation_wm2

    result = assess_citizen_risk(
        temperature_c=temperature_c,
        humidity_pct=humidity_pct,
        wind_speed_ms=wind_speed_ms,
        solar_radiation_wm2=solar_radiation_wm2,
        age=payload.age,
        gender=payload.gender,
        occupation=payload.occupation,
        has_chronic_condition=payload.has_chronic_condition,
        daily_outdoor_exposure_hours=payload.daily_outdoor_exposure_hours,
    )

    return CitizenRiskOut(
        personalized_risk_score=result.personalized_risk_score,
        risk_category=result.risk_category,
        heat_index_c=result.htsi.heat_index_c,
        wbgt_c=result.htsi.wbgt_c,
        utci_c=result.htsi.utci_c,
        recommended_actions=result.recommended_actions,
        emergency_guidance=result.emergency_guidance,
    )
