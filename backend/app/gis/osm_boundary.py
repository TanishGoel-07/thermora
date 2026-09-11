"""
Feature 9: Real GIS — fetches actual administrative boundaries from
OpenStreetMap's Overpass API so ward/district/state polygons on the map are
real boundaries instead of synthetic placeholder squares.

This module performs live network calls in production. It is not exercised
automatically in this environment (offline sandbox); wire it up via the
`/gis/wards/{id}/boundary/fetch-from-osm` endpoint once deployed with network
access, or call `fetch_boundary_by_name` directly from a data-loading script.
"""
from __future__ import annotations

import httpx

OVERPASS_URL = "https://overpass-api.de/api/interpreter"


async def fetch_boundary_by_name(place_name: str, admin_level: int) -> dict | None:
    """
    admin_level per OSM convention: 4 = state, 5/6 = district, 8/10 = ward/
    local body (varies by country — India typically uses 5 for district, 8
    for municipal wards where mapped).
    """
    query = f"""
    [out:json][timeout:25];
    relation["name"="{place_name}"]["admin_level"="{admin_level}"];
    out geom;
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(OVERPASS_URL, data={"data": query})
        resp.raise_for_status()
        payload = resp.json()

    elements = payload.get("elements", [])
    if not elements:
        return None

    return _relation_to_geojson(elements[0])


def _relation_to_geojson(relation: dict) -> dict:
    """Converts an Overpass 'relation' with geometry members into a GeoJSON
    Polygon/MultiPolygon by stitching outer ways together."""
    outer_coords = []
    for member in relation.get("members", []):
        if member.get("role") == "outer" and "geometry" in member:
            outer_coords.append([[pt["lon"], pt["lat"]] for pt in member["geometry"]])

    if not outer_coords:
        return {"type": "Polygon", "coordinates": []}

    if len(outer_coords) == 1:
        ring = outer_coords[0]
        if ring[0] != ring[-1]:
            ring.append(ring[0])
        return {"type": "Polygon", "coordinates": [ring]}

    # Multiple outer rings -> MultiPolygon
    polygons = []
    for ring in outer_coords:
        if ring[0] != ring[-1]:
            ring.append(ring[0])
        polygons.append([ring])
    return {"type": "MultiPolygon", "coordinates": polygons}
