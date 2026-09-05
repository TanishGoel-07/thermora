from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.database import get_db
from app.models.geography import Ward, UHIHotspot
from app.models.thermal import ThermalStressRecord
from app.gis.geojson_utils import wards_to_feature_collection, risk_color

router = APIRouter(prefix="/gis", tags=["gis"])


@router.get("/wards/heatmap")
def get_ward_heatmap(db: Session = Depends(get_db)):
    wards = db.query(Ward).all()

    subq = (
        select(
            ThermalStressRecord.ward_id,
            ThermalStressRecord.htsi_score,
            ThermalStressRecord.htsi_category,
        )
        .order_by(ThermalStressRecord.ward_id, desc(ThermalStressRecord.recorded_at))
        .distinct(ThermalStressRecord.ward_id)
    )
    rows = db.execute(subq).all()
    risk_by_ward = {
        r.ward_id: {"htsi_score": r.htsi_score, "htsi_category": r.htsi_category} for r in rows
    }

    return wards_to_feature_collection(wards, risk_by_ward)


@router.get("/hotspots")
def get_uhi_hotspots(db: Session = Depends(get_db)):
    hotspots = db.query(UHIHotspot).order_by(desc(UHIHotspot.detected_at)).limit(100).all()
    features = []
    for h in hotspots:
        ward = db.get(Ward, h.ward_id)
        if not ward:
            continue
        features.append(
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [ward.centroid_lon, ward.centroid_lat]},
                "properties": {
                    "ward_id": h.ward_id,
                    "surface_temp_c": h.surface_temp_c,
                    "intensity": h.intensity,
                    "color": risk_color(min(h.intensity * 15, 100)),
                },
            }
        )
    return {"type": "FeatureCollection", "features": features}
