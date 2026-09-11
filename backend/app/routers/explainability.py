from __future__ import annotations

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from pydantic import BaseModel

from app.database import get_db
from app.models.weather import WeatherObservation
from app.models.geography import Ward
from app.services.explainability import explain_heatwave_prediction
from app.services.ml.ensemble import predict_heatwave_ensemble
from app.services.thermal_stress import compute_htsi, risk_drivers

router = APIRouter(prefix="/explainability", tags=["explainability"])


class ContributorOut(BaseModel):
    factor: str
    direction_pct: float
    explanation: str


class HeatwaveExplanationOut(BaseModel):
    heatwave_probability: float
    severity_level: str
    contributors: list[ContributorOut]


@router.get("/ward/{ward_id}/heatwave", response_model=HeatwaveExplanationOut)
def explain_ward_heatwave(ward_id: int, db: Session = Depends(get_db)):
    """
    Example response shape (Feature 3 spec):
    {
      "heatwave_probability": 87,
      "contributors": [
        {"factor": "Temperature", "direction_pct": 40, ...},
        {"factor": "Humidity", "direction_pct": 20, ...},
        {"factor": "Solar Radiation", "direction_pct": 15, ...},
        {"factor": "Wind", "direction_pct": -8, ...},
        {"factor": "Health Vulnerability", "direction_pct": 20, ...}
      ]
    }
    """
    ward = db.get(Ward, ward_id)
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")

    rows = (
        db.execute(
            select(WeatherObservation)
            .where(WeatherObservation.ward_id == ward_id)
            .order_by(desc(WeatherObservation.observed_date))
            .limit(30)
        )
        .scalars()
        .all()
    )
    if not rows:
        raise HTTPException(status_code=404, detail="No weather history available for this ward")

    df = pd.DataFrame(
        [
            {
                "observed_date": r.observed_date,
                "temperature_c": r.temperature_c,
                "temperature_max_c": r.temperature_max_c or r.temperature_c + 3,
                "humidity_pct": r.humidity_pct,
                "wind_speed_ms": r.wind_speed_ms,
                "solar_radiation_wm2": r.solar_radiation_wm2,
            }
            for r in rows
        ]
    ).sort_values("observed_date")

    ensemble = predict_heatwave_ensemble(df)

    # Health-vulnerability push scaled by ward elderly % and impervious surface
    # (proxy for outdoor-worker density / limited access to cooling)
    vulnerability_boost = round(
        (ward.elderly_population_pct * 60 + ward.impervious_surface_pct * 20), 1
    )

    explanation = explain_heatwave_prediction(df, vulnerability_boost_pct=vulnerability_boost)

    return HeatwaveExplanationOut(
        heatwave_probability=round(ensemble["heatwave_probability"] * 100, 1),
        severity_level=ensemble["severity_level"],
        contributors=[ContributorOut(**c) for c in explanation["contributors"]],
    )


@router.get("/ward/{ward_id}/htsi", response_model=list[dict])
def explain_ward_htsi(ward_id: int, db: Session = Depends(get_db)):
    """Reuses the HTSI risk-driver breakdown (Temperature/Humidity/Wind/Solar/Vulnerability)."""
    from app.models.thermal import ThermalStressRecord
    from app.services.thermal_stress import HTSIResult

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
    return risk_drivers(result)
