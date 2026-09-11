"""
NASA POWER API ingestion.

Fetches daily meteorological data for a given lat/lon + date range and
persists it as WeatherObservation rows. NASA POWER is a free, no-key-required
REST API maintained by NASA Langley Research Center.

Docs: https://power.larc.nasa.gov/docs/services/api/
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

import httpx
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.weather import WeatherObservation

settings = get_settings()


class NasaPowerClient:
    def __init__(self) -> None:
        self.base_url = settings.NASA_POWER_BASE_URL
        self.parameters = settings.NASA_POWER_PARAMETERS
        self.community = settings.NASA_POWER_COMMUNITY

    def build_url(self, lat: float, lon: float, start: str, end: str) -> str:
        return (
            f"{self.base_url}?parameters={self.parameters}"
            f"&community={self.community}&longitude={lon}&latitude={lat}"
            f"&start={start}&end={end}&format=JSON"
        )

    async def fetch_range(
        self, lat: float, lon: float, start_date: datetime, end_date: datetime
    ) -> dict:
        start = start_date.strftime("%Y%m%d")
        end = end_date.strftime("%Y%m%d")
        url = self.build_url(lat, lon, start, end)
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.json()

    @staticmethod
    def parse_response(payload: dict) -> list[dict]:
        """Turns the NASA POWER JSON payload into a list of per-day dicts."""
        params = payload.get("properties", {}).get("parameter", {})
        if not params:
            return []
        dates = sorted(next(iter(params.values())).keys())
        records = []
        for d in dates:
            record = {"date": datetime.strptime(d, "%Y%m%d")}
            record["temperature_c"] = params.get("T2M", {}).get(d)
            record["temperature_max_c"] = params.get("T2M_MAX", {}).get(d)
            record["temperature_min_c"] = params.get("T2M_MIN", {}).get(d)
            record["humidity_pct"] = params.get("RH2M", {}).get(d)
            record["wind_speed_ms"] = params.get("WS2M", {}).get(d)
            record["solar_radiation_wm2"] = _to_wm2(params.get("ALLSKY_SFC_SW_DWN", {}).get(d))
            record["pressure_kpa"] = params.get("PS", {}).get(d)
            record["rainfall_mm"] = params.get("PRECTOTCORR", {}).get(d)
            records.append(record)
        return records


def _to_wm2(mj_per_day: Optional[float]) -> Optional[float]:
    """NASA POWER solar radiation is reported in MJ/m^2/day; convert to average W/m^2."""
    if mj_per_day is None:
        return None
    return round(mj_per_day * 1_000_000 / 86400, 2)


async def ingest_weather_for_ward(
    db: Session,
    ward_id: int,
    district_id: int,
    lat: float,
    lon: float,
    days_back: int = 30,
) -> int:
    """Fetch the last `days_back` days from NASA POWER and store them."""
    client = NasaPowerClient()
    end_date = datetime.utcnow() - timedelta(days=2)  # POWER has ~2 day latency
    start_date = end_date - timedelta(days=days_back)

    payload = await client.fetch_range(lat, lon, start_date, end_date)
    records = client.parse_response(payload)

    inserted = 0
    for r in records:
        if r["temperature_c"] is None:
            continue
        obs = WeatherObservation(
            ward_id=ward_id,
            district_id=district_id,
            source="NASA_POWER",
            latitude=lat,
            longitude=lon,
            observed_date=r["date"],
            temperature_c=r["temperature_c"],
            temperature_max_c=r["temperature_max_c"],
            temperature_min_c=r["temperature_min_c"],
            humidity_pct=r["humidity_pct"] or 40.0,
            wind_speed_ms=r["wind_speed_ms"] or 1.5,
            solar_radiation_wm2=r["solar_radiation_wm2"] or 400.0,
            pressure_kpa=r["pressure_kpa"],
            rainfall_mm=r["rainfall_mm"],
        )
        db.add(obs)
        inserted += 1
    db.commit()
    return inserted
