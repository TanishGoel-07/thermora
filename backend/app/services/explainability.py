"""
Feature 3: Explainable AI.

Produces a signed, percentage-based contribution breakdown for a heatwave
prediction (e.g. Temperature +40%, Wind -8%) by combining:
  1. The trained models' feature importances (global signal strength), with
  2. The direction and magnitude of each feature's deviation from a mild
     baseline for the specific ward/day being explained (local signal).

This is a transparent, dependency-light stand-in for a full SHAP explainer —
same spirit (attribute the prediction to its inputs), cheap enough to run
inline on every API call. Swapping in `shap.TreeExplainer` on the trained
XGBoost model is a drop-in upgrade if exact Shapley values are required.
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from app.services.ml.ensemble import EnsembleModelStore
from app.services.ml.features import FEATURE_COLUMNS, build_tabular_features

# Baselines represent a "mild, safe day" — deviations from these drive the
# signed contribution direction (hotter/more humid = positive risk push,
# windier = negative/protective push).
BASELINES = {
    "temperature_c": 28.0,
    "temperature_max_c": 32.0,
    "humidity_pct": 45.0,
    "wind_speed_ms": 3.5,
    "solar_radiation_wm2": 350.0,
}

# Human-readable grouping for the raw model features
FEATURE_GROUPS = {
    "temperature_c": "Temperature",
    "temperature_max_c": "Temperature",
    "temp_3day_mean": "Temperature",
    "temp_3day_max": "Temperature",
    "temp_7day_mean": "Temperature",
    "temp_anomaly": "Temperature",
    "heat_index_est": "Temperature",
    "humidity_pct": "Humidity",
    "humidity_7day_mean": "Humidity",
    "wind_speed_ms": "Wind",
    "solar_radiation_wm2": "Solar Radiation",
    "day_of_year_sin": "Seasonality",
    "day_of_year_cos": "Seasonality",
}

# Wind is protective (higher wind -> lower risk), everything else here
# pushes risk up as it increases.
DIRECTION_SIGN = {"Wind": -1}


def explain_heatwave_prediction(
    history_df: pd.DataFrame, vulnerability_boost_pct: float = 0.0
) -> dict:
    """
    Returns {"heatwave_probability": .., "contributors": [{"factor", "direction_pct", "explanation"}]}
    contributors sum (in absolute terms) to ~100% including vulnerability.
    """
    history_df = history_df.sort_values("observed_date").reset_index(drop=True)
    features_df = build_tabular_features(history_df)
    latest = features_df.iloc[-1]

    if not EnsembleModelStore.load():
        # Fallback: purely heuristic contribution split when models aren't trained yet
        contributions = _heuristic_contributions(latest)
    else:
        importances = _blended_feature_importance()
        contributions = {}
        for feat in FEATURE_COLUMNS:
            baseline = BASELINES.get(feat)
            value = latest[feat]
            importance = importances.get(feat, 0.0)
            if baseline is not None:
                deviation = (value - baseline) / max(abs(baseline), 1e-6)
            else:
                deviation = 0.0  # seasonality terms don't have a meaningful "baseline push"
            contributions[feat] = importance * deviation

    grouped: dict[str, float] = {}
    for feat, contrib in contributions.items():
        group = FEATURE_GROUPS.get(feat, "Other")
        sign = DIRECTION_SIGN.get(group, 1)
        grouped[group] = grouped.get(group, 0.0) + contrib * sign

    if vulnerability_boost_pct:
        grouped["Health Vulnerability"] = vulnerability_boost_pct

    total_abs = sum(abs(v) for v in grouped.values()) or 1.0
    contributors = []
    for factor, raw in sorted(grouped.items(), key=lambda kv: abs(kv[1]), reverse=True):
        pct = round(raw / total_abs * 100, 1)
        contributors.append(
            {
                "factor": factor,
                "direction_pct": pct,
                "explanation": _explain_factor(factor, pct),
            }
        )
    return {"contributors": contributors}


def _blended_feature_importance() -> dict[str, float]:
    """Averages XGBoost + Random Forest feature_importances_, normalized to sum to 1."""
    rf = EnsembleModelStore._rf
    xgb = EnsembleModelStore._xgb
    if rf is None or xgb is None:
        return {f: 1 / len(FEATURE_COLUMNS) for f in FEATURE_COLUMNS}

    rf_imp = np.array(rf.feature_importances_)
    xgb_imp = np.array(xgb.feature_importances_)
    blended = (rf_imp + xgb_imp) / 2
    blended = blended / (blended.sum() or 1.0)
    return dict(zip(FEATURE_COLUMNS, blended))


def _heuristic_contributions(latest_row: pd.Series) -> dict[str, float]:
    contributions = {}
    for feat, baseline in BASELINES.items():
        if feat in latest_row:
            deviation = (latest_row[feat] - baseline) / max(abs(baseline), 1e-6)
            contributions[feat] = deviation
    return contributions


def _explain_factor(factor: str, pct: float) -> str:
    direction = "increasing" if pct >= 0 else "reducing"
    templates = {
        "Temperature": f"Above-baseline air temperature is {direction} heatwave risk.",
        "Humidity": f"Moisture levels are {direction} the body's ability to cool via evaporation.",
        "Wind": f"Wind speed is {direction} convective heat loss and overall risk.",
        "Solar Radiation": f"Solar load is {direction} the effective outdoor temperature.",
        "Seasonality": f"Time-of-year climatology is {direction} the baseline risk expectation.",
        "Health Vulnerability": f"Age, health conditions, or occupation are {direction} personal risk.",
    }
    return templates.get(factor, f"{factor} is {direction} the overall risk score.")
