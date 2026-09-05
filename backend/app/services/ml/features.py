"""
Feature engineering for heatwave prediction models.

Given a rolling window of daily weather observations, builds the feature
vector consumed by XGBoost / Random Forest, and the sequence tensor consumed
by the LSTM.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

FEATURE_COLUMNS = [
    "temperature_c",
    "temperature_max_c",
    "humidity_pct",
    "wind_speed_ms",
    "solar_radiation_wm2",
    "temp_3day_mean",
    "temp_3day_max",
    "temp_7day_mean",
    "temp_anomaly",
    "humidity_7day_mean",
    "heat_index_est",
    "day_of_year_sin",
    "day_of_year_cos",
]

SEQUENCE_LENGTH = 7  # days fed into the LSTM


def build_tabular_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    df must be sorted ascending by date and contain:
    temperature_c, temperature_max_c, humidity_pct, wind_speed_ms,
    solar_radiation_wm2, observed_date
    """
    out = df.copy().reset_index(drop=True)
    out["temp_3day_mean"] = out["temperature_c"].rolling(3, min_periods=1).mean()
    out["temp_3day_max"] = out["temperature_c"].rolling(3, min_periods=1).max()
    out["temp_7day_mean"] = out["temperature_c"].rolling(7, min_periods=1).mean()
    climatological_mean = out["temperature_c"].expanding(min_periods=1).mean()
    out["temp_anomaly"] = out["temperature_c"] - climatological_mean
    out["humidity_7day_mean"] = out["humidity_pct"].rolling(7, min_periods=1).mean()

    # crude heat index approximation for use purely as a model feature
    out["heat_index_est"] = out["temperature_c"] + 0.05 * out["humidity_pct"]

    doy = pd.to_datetime(out["observed_date"]).dt.dayofyear
    out["day_of_year_sin"] = np.sin(2 * np.pi * doy / 365.25)
    out["day_of_year_cos"] = np.cos(2 * np.pi * doy / 365.25)

    out = out.fillna(method="bfill").fillna(method="ffill")
    return out


def build_sequence_tensor(df: pd.DataFrame, seq_len: int = SEQUENCE_LENGTH) -> np.ndarray:
    """Returns shape (n_samples, seq_len, n_features) for LSTM input."""
    feats = df[["temperature_c", "humidity_pct", "wind_speed_ms", "solar_radiation_wm2"]].values
    sequences = []
    for i in range(len(feats) - seq_len + 1):
        sequences.append(feats[i : i + seq_len])
    if not sequences:
        return np.zeros((0, seq_len, feats.shape[1]))
    return np.stack(sequences)


def label_heatwave(temp_series: pd.Series, percentile: float = 90.0, min_consecutive: int = 3) -> pd.Series:
    """
    Heuristic heatwave label used to train supervised models on historical
    data: a day is part of a heatwave if temperature exceeds the location's
    90th percentile for at least `min_consecutive` consecutive days.
    """
    threshold = np.percentile(temp_series, percentile)
    is_hot = temp_series >= threshold
    labels = np.zeros(len(temp_series), dtype=int)

    run_start = None
    for i, hot in enumerate(is_hot):
        if hot and run_start is None:
            run_start = i
        elif not hot and run_start is not None:
            if i - run_start >= min_consecutive:
                labels[run_start:i] = 1
            run_start = None
    if run_start is not None and len(is_hot) - run_start >= min_consecutive:
        labels[run_start:] = 1

    return pd.Series(labels, index=temp_series.index)
