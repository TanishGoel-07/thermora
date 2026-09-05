"""
Generates physically plausible synthetic daily weather history so the ML
pipeline has something meaningful to train on before enough real NASA POWER
history has accumulated in the database. Seasonal cycle + heatwave bursts +
noise, calibrated loosely to a North-Indian subtropical climate.
"""
from __future__ import annotations

import numpy as np
import pandas as pd


def generate_synthetic_history(
    start_date: str = "2015-01-01",
    end_date: str = "2025-12-31",
    base_temp: float = 25.0,
    seasonal_amplitude: float = 12.0,
    seed: int = 42,
) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    dates = pd.date_range(start_date, end_date, freq="D")
    n = len(dates)
    doy = dates.dayofyear.values

    # Seasonal cycle peaking in late May / early June (North India summer)
    seasonal = seasonal_amplitude * np.sin(2 * np.pi * (doy - 100) / 365.25)
    temp = base_temp + seasonal + rng.normal(0, 1.8, n)

    # Inject random heatwave bursts in summer months
    is_summer = np.isin(dates.month, [4, 5, 6])
    heatwave_mask = np.zeros(n, dtype=bool)
    i = 0
    while i < n:
        if is_summer[i] and rng.random() < 0.02:
            duration = rng.integers(3, 9)
            heatwave_mask[i : i + duration] = True
            temp[i : i + duration] += rng.uniform(4, 8)
            i += duration
        else:
            i += 1

    humidity = np.clip(55 - 0.5 * seasonal + rng.normal(0, 8, n), 10, 95)
    wind = np.clip(2.5 + rng.normal(0, 1.0, n), 0.2, 10)
    solar = np.clip(450 + 150 * np.sin(2 * np.pi * (doy - 80) / 365.25) + rng.normal(0, 40, n), 100, 900)
    pressure = np.clip(101.0 + rng.normal(0, 0.4, n), 98, 103)
    rainfall = np.where(
        np.isin(dates.month, [7, 8, 9]), np.abs(rng.normal(8, 12, n)), np.abs(rng.normal(0.3, 1.0, n))
    )

    df = pd.DataFrame(
        {
            "observed_date": dates,
            "temperature_c": temp,
            "temperature_max_c": temp + rng.uniform(2, 5, n),
            "temperature_min_c": temp - rng.uniform(3, 6, n),
            "humidity_pct": humidity,
            "wind_speed_ms": wind,
            "solar_radiation_wm2": solar,
            "pressure_kpa": pressure,
            "rainfall_mm": rainfall,
        }
    )
    return df
