from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from pydantic import BaseModel
from typing import Any

from app.database import get_db
from app.models.geography import Ward, UHIHotspot
from app.models.thermal import ThermalStressRecord
from app.gis.geojson_utils import wards_to_feature_collection, risk_color
from app.gis.osm_boundary import fetch_boundary_by_name
from app.core.cache import cache_response

router = APIRouter(prefix="/gis", tags=["gis"])


class BoundaryUploadIn(BaseModel):
    geometry: dict[str, Any]  # raw GeoJSON geometry (Polygon or MultiPolygon)
    source: str = "upload"


@router.get("/wards/heatmap")
@cache_response(ttl_seconds=30, key="gis:ward-heatmap")
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


@router.post("/wards/{ward_id}/boundary")
def upload_ward_boundary(ward_id: int, payload: BoundaryUploadIn, db: Session = Depends(get_db)):
    """
    Feature 9: attach a real administrative boundary (GeoJSON Polygon/
    MultiPolygon, e.g. converted from a municipal shapefile or GADM export)
    to a ward. Once set, the heatmap renders this instead of the synthetic
    placeholder square.
    """
    ward = db.get(Ward, ward_id)
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")
    if payload.geometry.get("type") not in ("Polygon", "MultiPolygon"):
        raise HTTPException(status_code=400, detail="geometry must be a Polygon or MultiPolygon")

    ward.boundary_geojson = payload.geometry
    ward.boundary_source = payload.source
    db.commit()
    return {"ward_id": ward_id, "boundary_source": ward.boundary_source, "status": "stored"}


@router.post("/wards/{ward_id}/boundary/fetch-from-osm")
async def fetch_ward_boundary_from_osm(
    ward_id: int, place_name: str, admin_level: int = 8, db: Session = Depends(get_db)
):
    """
    Feature 9: pulls a real ward/local-body boundary from OpenStreetMap's
    Overpass API by name and admin_level, and stores it. Requires outbound
    network access in the deployment environment.
    """
    ward = db.get(Ward, ward_id)
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")

    try:
        geometry = await fetch_boundary_by_name(place_name, admin_level)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"OSM Overpass lookup failed: {exc}") from exc

    if not geometry:
        raise HTTPException(status_code=404, detail=f"No OSM boundary found for '{place_name}'")

    ward.boundary_geojson = geometry
    ward.boundary_source = "osm"
    db.commit()
    return {"ward_id": ward_id, "boundary_source": "osm", "status": "stored"}


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
                    "ndvi": h.ndvi,
                    "uhi_index": h.uhi_index,
                    "satellite_source": h.satellite_source,
                    "color": risk_color(min(h.intensity * 15, 100)),
                },
            }
        )
    return {"type": "FeatureCollection", "features": features}
