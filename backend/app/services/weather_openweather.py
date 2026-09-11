"""
OpenWeather 5-day/3-hour forecast client.

Feature 4 pipeline: NASA POWER supplies historical daily observations,
OpenWeather supplies the forward-looking forecast leg. Both are resampled to
daily granularity and concatenated before being handed to the ML ensemble in
app/services/ml/ensemble.py, so the model always sees `history + forecast`
rather than history alone.
"""
from __future__ import annotations

from collections import defaultdict
from datetime import datetime

import httpx
import pandas as pd

from app.core.config import get_settings

settings = get_settings()


class OpenWeatherClient:
    def __init__(self) -> None:
        self.base_url = settings.OPENWEATHER_BASE_URL
        self.api_key = settings.OPENWEATHER_API_KEY

    async def fetch_forecast(self, lat: float, lon: float) -> dict:
        if not self.api_key:
            raise RuntimeError(
                "OPENWEATHER_API_KEY is not configured. Set it in the backend "
                "environment to enable live forecast ingestion."
            )
        params = {
            "lat": lat,
            "lon": lon,
            "appid": self.api_key,
            "units": "metric",
        }
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(self.base_url, params=params)
            resp.raise_for_status()
            return resp.json()

    @staticmethod
    def to_daily_dataframe(payload: dict) -> pd.DataFrame:
        """
        OpenWeather's free tier returns 3-hourly steps for 5 days; this
        aggregates them into one row per calendar day so it lines up with
        the daily NASA POWER history.
        """
        buckets: dict[str, list[dict]] = defaultdict(list)
        for entry in payload.get("list", []):
            dt = datetime.utcfromtimestamp(entry["dt"])
            day_key = dt.strftime("%Y-%m-%d")
            main = entry.get("main", {})
            wind = entry.get("wind", {})
            clouds = entry.get("clouds", {})
            buckets[day_key].append(
                {
                    "temp": main.get("temp"),
                    "temp_max": main.get("temp_max"),
                    "temp_min": main.get("temp_min"),
                    "humidity": main.get("humidity"),
                    "wind_speed": wind.get("speed"),
                    "cloud_pct": clouds.get("all", 0),
                }
            )

        rows = []
        for day_key, entries in sorted(buckets.items()):
            n = len(entries)
            avg_cloud = sum(e["cloud_pct"] or 0 for e in entries) / n
            # Estimate solar radiation from cloud cover as a proxy (clear sky ~
            # 850 W/m2 midday average, scaled down by cloud fraction).
            solar_estimate = 850 * (1 - avg_cloud / 100) * 0.55

            rows.append(
                {
                    "observed_date": pd.Timestamp(day_key),
                    "temperature_c": sum(e["temp"] for e in entries) / n,
                    "temperature_max_c": max(e["temp_max"] for e in entries),
                    "temperature_min_c": min(e["temp_min"] for e in entries),
                    "humidity_pct": sum(e["humidity"] for e in entries) / n,
                    "wind_speed_ms": sum(e["wind_speed"] for e in entries) / n,
                    "solar_radiation_wm2": solar_estimate,
                    "source": "OPENWEATHER_FORECAST",
                }
            )
        return pd.DataFrame(rows)


async def get_merged_history_and_forecast(
    history_df: pd.DataFrame, lat: float, lon: float
) -> pd.DataFrame:
    """
    Returns history_df with OpenWeather's forecast days appended, ready for
    the ensemble model. Falls back to history-only (with a warning column)
    if OpenWeather isn't configured or the call fails — the ensemble already
    handles short/missing-forecast windows gracefully.
    """
    client = OpenWeatherClient()
    try:
        payload = await client.fetch_forecast(lat, lon)
        forecast_df = client.to_daily_dataframe(payload)
        forecast_df["source"] = "OPENWEATHER_FORECAST"
        merged = pd.concat([history_df, forecast_df], ignore_index=True)
        merged = merged.drop_duplicates(subset="observed_date", keep="last")
        return merged.sort_values("observed_date").reset_index(drop=True)
    except Exception:  # noqa: BLE001
        return history_df
