from __future__ import annotations

import math
from typing import Iterable

from app.models.geography import Ward


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def make_ward_square_polygon(lat: float, lon: float, half_extent_deg: float = 0.01) -> list[list[float]]:
    """
    Generates a simple square polygon (lon,lat pairs, GeoJSON winding order)
    centered on a ward centroid — used when no authoritative ward boundary
    shapefile is available.
    """
    return [
        [lon - half_extent_deg, lat - half_extent_deg],
        [lon + half_extent_deg, lat - half_extent_deg],
        [lon + half_extent_deg, lat + half_extent_deg],
        [lon - half_extent_deg, lat + half_extent_deg],
        [lon - half_extent_deg, lat - half_extent_deg],
    ]


def risk_color(risk_score: float) -> str:
    if risk_score < 30:
        return "#22c55e"  # green
    if risk_score < 55:
        return "#eab308"  # yellow
    if risk_score < 80:
        return "#f97316"  # orange
    return "#ef4444"  # red


def wards_to_feature_collection(wards: Iterable[Ward], risk_by_ward: dict[int, dict]) -> dict:
    features = []
    for ward in wards:
        risk = risk_by_ward.get(ward.id, {"htsi_score": 0, "htsi_category": "Safe"})
        polygon = make_ward_square_polygon(ward.centroid_lat, ward.centroid_lon)
        features.append(
            {
                "type": "Feature",
                "geometry": {"type": "Polygon", "coordinates": [polygon]},
                "properties": {
                    "ward_id": ward.id,
                    "name": ward.name,
                    "ward_number": ward.ward_number,
                    "population": ward.population,
                    "htsi_score": risk.get("htsi_score", 0),
                    "htsi_category": risk.get("htsi_category", "Safe"),
                    "color": risk_color(risk.get("htsi_score", 0)),
                },
            }
        )
    return {"type": "FeatureCollection", "features": features}
