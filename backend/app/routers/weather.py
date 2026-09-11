from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.database import get_db
from app.models.geography import Ward
from app.models.weather import WeatherObservation
from app.schemas.schemas import WeatherObservationOut
from app.services.weather_ingestion import ingest_weather_for_ward

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("/ward/{ward_id}", response_model=list[WeatherObservationOut])
def get_ward_weather(ward_id: int, limit: int = 30, db: Session = Depends(get_db)):
    rows = (
        db.execute(
            select(WeatherObservation)
            .where(WeatherObservation.ward_id == ward_id)
            .order_by(desc(WeatherObservation.observed_date))
            .limit(limit)
        )
        .scalars()
        .all()
    )
    return list(reversed(rows))


@router.post("/ward/{ward_id}/ingest")
async def trigger_ingestion(ward_id: int, days_back: int = 30, db: Session = Depends(get_db)):
    ward = db.get(Ward, ward_id)
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")
    try:
        count = await ingest_weather_for_ward(
            db, ward.id, ward.district_id, ward.centroid_lat, ward.centroid_lon, days_back
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"NASA POWER ingestion failed: {exc}") from exc
    return {"ward_id": ward_id, "inserted_records": count}
