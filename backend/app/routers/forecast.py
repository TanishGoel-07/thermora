from __future__ import annotations

from datetime import datetime, timedelta

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.database import get_db
from app.models.weather import WeatherObservation
from app.models.geography import Ward
from app.models.prediction import HeatwavePrediction
from app.schemas.schemas import ForecastDayOut, HeatwavePredictionOut
from app.services.ml.ensemble import predict_heatwave_ensemble
from app.services.weather_openweather import get_merged_history_and_forecast

router = APIRouter(prefix="/forecast", tags=["forecast"])


@router.get("/ward/{ward_id}/5-day", response_model=list[ForecastDayOut])
async def get_five_day_forecast(ward_id: int, db: Session = Depends(get_db)):
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

    # Feature 4: blend NASA POWER history with OpenWeather's forward-looking
    # forecast leg when a key is configured; degrades to history-only otherwise.
    df = await get_merged_history_and_forecast(df, ward.centroid_lat, ward.centroid_lon)

    forecasts = []
    today = datetime.utcnow()
    for day in range(1, 6):
        target_date = today + timedelta(days=day)
        result = predict_heatwave_ensemble(df, horizon_days=day)

        forecasts.append(
            ForecastDayOut(
                date=target_date,
                day_label=target_date.strftime("%a"),
                risk_pct=round(result["heatwave_probability"] * 100, 1),
                severity=result["severity_level"],
                heatwave_probability=result["heatwave_probability"],
                estimated_duration_days=result["estimated_duration_days"],
            )
        )

        # persist prediction
        db.add(
            HeatwavePrediction(
                ward_id=ward_id,
                target_date=target_date,
                horizon_days=day,
                heatwave_probability=result["heatwave_probability"],
                severity_score=result["severity_score"],
                severity_level=result["severity_level"],
                estimated_duration_days=result["estimated_duration_days"],
                xgb_probability=result["xgb_probability"],
                rf_probability=result["rf_probability"],
                lstm_probability=result["lstm_probability"],
            )
        )
    db.commit()
    return forecasts


@router.get("/ward/{ward_id}/latest-ensemble", response_model=HeatwavePredictionOut)
def get_latest_ensemble_prediction(ward_id: int, db: Session = Depends(get_db)):
    pred = (
        db.execute(
            select(HeatwavePrediction)
            .where(HeatwavePrediction.ward_id == ward_id)
            .order_by(desc(HeatwavePrediction.prediction_made_at))
            .limit(1)
        )
        .scalars()
        .first()
    )
    if not pred:
        raise HTTPException(status_code=404, detail="No prediction available for this ward")
    return pred
