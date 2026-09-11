from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.database import get_db
from app.models.geography import Ward, District, UHIHotspot
from app.models.weather import WeatherObservation
from app.services.satellite.uhi_pipeline import analyze_ward_bands, generate_synthetic_bands

router = APIRouter(prefix="/uhi", tags=["urban-heat-island"])


@router.post("/ward/{ward_id}/analyze")
def analyze_ward_uhi(ward_id: int, satellite: str = "synthetic", db: Session = Depends(get_db)):
    """
    Feature 10: runs the NDVI / LST / UHI-index pipeline for a ward and
    stores the result in PostGIS (uhi_hotspots).

    satellite="synthetic" (default) generates physically-plausible bands from
    the ward's known vegetation/impervious profile so the full pipeline is
    demonstrable without a satellite subscription. In production, swap this
    for `load_raster_bands(path_to_geotiff)` with real Sentinel-2/Landsat-8
    scenes clipped to the ward boundary.
    """
    ward = db.get(Ward, ward_id)
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")

    district = db.get(District, ward.district_id)
    district_wards = db.query(Ward).filter(Ward.district_id == ward.district_id).all()

    latest_temp = (
        db.execute(
            select(WeatherObservation)
            .where(WeatherObservation.ward_id == ward_id)
            .order_by(desc(WeatherObservation.observed_date))
            .limit(1)
        )
        .scalars()
        .first()
    )
    ambient_temp = latest_temp.temperature_c if latest_temp else 35.0

    # District-mean temperature proxy: same ambient reading nudged by each
    # ward's own imperviousness (crude, but keeps the pipeline self-contained
    # without requiring a full district-wide raster mosaic).
    district_mean_temp = ambient_temp + 1.5  # slight urban-core bias

    bands = generate_synthetic_bands(
        vegetation_index=ward.vegetation_index,
        impervious_pct=ward.impervious_surface_pct,
    )

    if satellite == "landsat8":
        result = analyze_ward_bands(
            red_band=bands["red"],
            nir_band=bands["nir"],
            district_mean_temp_c=district_mean_temp,
            thermal_band_kelvin=bands["thermal_kelvin"],
        )
    else:
        result = analyze_ward_bands(
            red_band=bands["red"],
            nir_band=bands["nir"],
            district_mean_temp_c=district_mean_temp,
            ambient_air_temp_c=ambient_temp,
        )

    hotspot = UHIHotspot(
        ward_id=ward.id,
        surface_temp_c=result.mean_surface_temp_c,
        intensity=result.intensity_c,
        ndvi=result.mean_ndvi,
        uhi_index=result.uhi_index,
        satellite_source=result.satellite_source,
        detected_at=datetime.utcnow(),
    )
    db.add(hotspot)
    db.commit()
    db.refresh(hotspot)

    return {
        "ward_id": ward.id,
        "ward_name": ward.name,
        "ndvi": result.mean_ndvi,
        "surface_temp_c": result.mean_surface_temp_c,
        "uhi_index": result.uhi_index,
        "intensity_above_district_mean_c": result.intensity_c,
        "satellite_source": result.satellite_source,
    }


@router.get("/ward/{ward_id}/history")
def get_ward_uhi_history(ward_id: int, limit: int = 30, db: Session = Depends(get_db)):
    rows = (
        db.execute(
            select(UHIHotspot)
            .where(UHIHotspot.ward_id == ward_id)
            .order_by(desc(UHIHotspot.detected_at))
            .limit(limit)
        )
        .scalars()
        .all()
    )
    return [
        {
            "detected_at": r.detected_at,
            "surface_temp_c": r.surface_temp_c,
            "ndvi": r.ndvi,
            "uhi_index": r.uhi_index,
            "intensity": r.intensity,
            "satellite_source": r.satellite_source,
        }
        for r in reversed(rows)
    ]
