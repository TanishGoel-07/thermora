from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.cooling import CoolingCenter
from app.schemas.schemas import CoolingCenterOut
from app.gis.geojson_utils import haversine_km

router = APIRouter(prefix="/cooling-centers", tags=["cooling-centers"])

# Assumed average urban travel speed for ETA estimation (km/h). Walking-biased
# blend since most cooling-center trips during a heatwave are short/local.
ASSUMED_TRAVEL_SPEED_KMH = 18.0


def _travel_time_minutes(distance_km: float) -> float:
    return round((distance_km / ASSUMED_TRAVEL_SPEED_KMH) * 60, 1)


def _availability_score(center: CoolingCenter) -> float:
    """0-100: higher is better (more free capacity, has AC/water, 24h access)."""
    if center.capacity <= 0:
        occupancy_pct = 100.0
    else:
        occupancy_pct = min((center.current_occupancy / center.capacity) * 100, 100.0)
    score = (100 - occupancy_pct) * 0.7
    score += 15 if center.has_ac else 0
    score += 10 if center.has_water else 0
    score += 5 if center.is_open_24h else 0
    return round(score, 1)


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


@router.get("/recommend")
def recommend_cooling_center(lat: float, lon: float, radius_km: float = 5.0, db: Session = Depends(get_db)):
    """
    Feature 7: automatically recommends the single best cooling center near a
    citizen, balancing distance/travel time against live capacity and
    amenities rather than just picking the nearest door.
    """
    centers = db.query(CoolingCenter).all()
    candidates = []
    for c in centers:
        distance = haversine_km(lat, lon, c.latitude, c.longitude)
        if distance > radius_km:
            continue
        availability = _availability_score(c)
        # Composite score: proximity matters most, but a nearly-full center
        # nearby loses to a slightly farther center with real capacity.
        proximity_score = max(0.0, 100 - (distance / radius_km) * 100)
        composite = 0.55 * proximity_score + 0.45 * availability
        candidates.append(
            {
                "id": c.id,
                "name": c.name,
                "address": c.address,
                "distance_km": round(distance, 2),
                "travel_time_minutes": _travel_time_minutes(distance),
                "capacity": c.capacity,
                "current_occupancy": c.current_occupancy,
                "availability_score": availability,
                "composite_score": round(composite, 1),
                "has_ac": c.has_ac,
                "has_water": c.has_water,
                "is_open_24h": c.is_open_24h,
                "latitude": c.latitude,
                "longitude": c.longitude,
            }
        )

    if not candidates:
        raise HTTPException(
            status_code=404, detail=f"No cooling centers found within {radius_km} km."
        )

    candidates.sort(key=lambda c: c["composite_score"], reverse=True)
    return {"recommended": candidates[0], "alternatives": candidates[1:5]}
