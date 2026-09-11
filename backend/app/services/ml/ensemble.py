"""
Loads the trained RF / XGBoost / LSTM models and produces a blended
heatwave-probability ensemble prediction for a given weather history window.

If model artifacts are not yet trained (fresh install), falls back to a
transparent heuristic so the API never errors out.
"""
from __future__ import annotations

import os
import joblib
import numpy as np
import pandas as pd
import torch

from app.core.config import get_settings
from app.services.ml.features import FEATURE_COLUMNS, SEQUENCE_LENGTH, build_tabular_features, build_sequence_tensor
from app.services.ml.train import HeatwaveLSTM

settings = get_settings()

_ENSEMBLE_WEIGHTS = {"xgb": 0.45, "rf": 0.30, "lstm": 0.25}


class EnsembleModelStore:
    """Lazily loads and caches trained model artifacts."""

    _rf = None
    _xgb = None
    _scaler = None
    _lstm = None
    _loaded = False

    @classmethod
    def load(cls) -> bool:
        if cls._loaded:
            return True
        model_dir = settings.MODEL_DIR
        rf_path = os.path.join(model_dir, "random_forest.joblib")
        xgb_path = os.path.join(model_dir, "xgboost.joblib")
        scaler_path = os.path.join(model_dir, "scaler.joblib")
        lstm_path = os.path.join(model_dir, "lstm.pt")

        if not all(os.path.exists(p) for p in [rf_path, xgb_path, scaler_path, lstm_path]):
            return False

        cls._rf = joblib.load(rf_path)
        cls._xgb = joblib.load(xgb_path)
        cls._scaler = joblib.load(scaler_path)
        cls._lstm = HeatwaveLSTM(n_features=4)
        cls._lstm.load_state_dict(torch.load(lstm_path, map_location="cpu"))
        cls._lstm.eval()
        cls._loaded = True
        return True


def _heuristic_probability(recent_df: pd.DataFrame) -> float:
    """Simple physically-grounded fallback when models aren't trained yet."""
    recent_temp = recent_df["temperature_c"].tail(3).mean()
    baseline = recent_df["temperature_c"].mean()
    anomaly = recent_temp - baseline
    prob = 1 / (1 + np.exp(-(anomaly - 3) / 2))  # logistic curve centered at +3C anomaly
    return float(np.clip(prob, 0.01, 0.99))


def predict_heatwave_ensemble(history_df: pd.DataFrame, horizon_days: int = 1) -> dict:
    """
    history_df: at least SEQUENCE_LENGTH rows of daily weather ending "today",
    columns: observed_date, temperature_c, temperature_max_c, humidity_pct,
    wind_speed_ms, solar_radiation_wm2
    """
    history_df = history_df.sort_values("observed_date").reset_index(drop=True)

    if not EnsembleModelStore.load() or len(history_df) < SEQUENCE_LENGTH:
        prob = _heuristic_probability(history_df)
        return _finalize(prob, prob, prob, prob, history_df, horizon_days)

    features_df = build_tabular_features(history_df)
    X = features_df[FEATURE_COLUMNS].values[-1:]
    X_scaled = EnsembleModelStore._scaler.transform(X)

    rf_prob = float(EnsembleModelStore._rf.predict_proba(X_scaled)[0][1])
    xgb_prob = float(EnsembleModelStore._xgb.predict_proba(X_scaled)[0][1])

    sequences = build_sequence_tensor(features_df, seq_len=SEQUENCE_LENGTH)
    if len(sequences) == 0:
        lstm_prob = (rf_prob + xgb_prob) / 2
    else:
        with torch.no_grad():
            x_tensor = torch.tensor(sequences[-1:], dtype=torch.float32)
            lstm_prob = float(EnsembleModelStore._lstm(x_tensor).item())

    ensemble_prob = (
        _ENSEMBLE_WEIGHTS["xgb"] * xgb_prob
        + _ENSEMBLE_WEIGHTS["rf"] * rf_prob
        + _ENSEMBLE_WEIGHTS["lstm"] * lstm_prob
    )

    # Slight decay in confidence for longer horizons
    horizon_decay = max(0.6, 1 - 0.04 * (horizon_days - 1))
    ensemble_prob = ensemble_prob * horizon_decay

    return _finalize(ensemble_prob, xgb_prob, rf_prob, lstm_prob, history_df, horizon_days)


def _finalize(ensemble_prob, xgb_prob, rf_prob, lstm_prob, history_df, horizon_days) -> dict:
    ensemble_prob = float(np.clip(ensemble_prob, 0.0, 1.0))
    severity_score = round(ensemble_prob * 100, 1)

    if severity_score < 30:
        severity_level = "Low"
        duration = round(1 + ensemble_prob * 2, 1)
    elif severity_score < 55:
        severity_level = "Moderate"
        duration = round(2 + ensemble_prob * 3, 1)
    elif severity_score < 80:
        severity_level = "High"
        duration = round(3 + ensemble_prob * 4, 1)
    else:
        severity_level = "Extreme"
        duration = round(4 + ensemble_prob * 5, 1)

    return {
        "heatwave_probability": round(ensemble_prob, 3),
        "severity_score": severity_score,
        "severity_level": severity_level,
        "estimated_duration_days": duration,
        "xgb_probability": round(float(xgb_prob), 3),
        "rf_probability": round(float(rf_prob), 3),
        "lstm_probability": round(float(lstm_prob), 3),
        "horizon_days": horizon_days,
    }
