from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.cooling import CoolingCenter
from app.schemas.schemas import CoolingCenterOut
from app.gis.geojson_utils import haversine_km

router = APIRouter(prefix="/cooling-centers", tags=["cooling-centers"])


@router.get("", response_model=list[CoolingCenterOut])
def list_cooling_centers(
    lat: float | None = None,
    lon: float | None = None,
    ward_id: int | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(CoolingCenter)
    if ward_id is not None:
        query = query.filter(CoolingCenter.ward_id == ward_id)
    centers = query.all()

    results = []
    for c in centers:
        distance = None
        if lat is not None and lon is not None:
            distance = round(haversine_km(lat, lon, c.latitude, c.longitude), 2)
        results.append(
            CoolingCenterOut(
                id=c.id,
                ward_id=c.ward_id,
                name=c.name,
                type=c.type,
                capacity=c.capacity,
                current_occupancy=c.current_occupancy,
                has_ac=c.has_ac,
                has_water=c.has_water,
                is_open_24h=c.is_open_24h,
                latitude=c.latitude,
                longitude=c.longitude,
                address=c.address,
                distance_km=distance,
            )
        )
    if lat is not None and lon is not None:
        results.sort(key=lambda r: r.distance_km if r.distance_km is not None else 1e9)
    return results
