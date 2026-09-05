"""
Predicts expected heat-stroke case load, hospital admissions, and ICU demand
for a ward's hospitals given the current/forecast thermal stress severity and
ward demographics.

Model: epidemiologically-inspired incidence-rate scaling. Not a substitute
for a calibrated regression model trained on real admissions data, but
produces directionally sound, explainable numbers out of the box.
"""
from __future__ import annotations

from app.models.geography import Ward
from app.models.hospital import Hospital

# Baseline heat-stroke incidence per 100,000 population per day at HTSI=100
BASE_INCIDENCE_PER_100K = 8.0
ADMISSION_RATE = 0.35  # fraction of heat-stroke cases requiring admission
ICU_RATE = 0.12  # fraction of admissions requiring ICU


def predict_hospital_surge(
    ward: Ward, hospital: Hospital, htsi_score: float
) -> dict:
    severity_factor = (htsi_score / 100.0) ** 1.8  # convex: risk grows fast at high HTSI
    vulnerability_factor = 1 + ward.elderly_population_pct + 0.3 * ward.impervious_surface_pct

    expected_cases = (
        (ward.population / 100_000)
        * BASE_INCIDENCE_PER_100K
        * severity_factor
        * vulnerability_factor
    )
    expected_admissions = expected_cases * ADMISSION_RATE
    expected_icu = expected_admissions * ICU_RATE

    capacity_utilization = (
        (expected_admissions / hospital.available_beds) * 100 if hospital.available_beds else 100.0
    )
    capacity_utilization = min(capacity_utilization, 100.0)

    if capacity_utilization < 40:
        surge_level = "Normal"
    elif capacity_utilization < 70:
        surge_level = "Elevated"
    elif capacity_utilization < 90:
        surge_level = "High"
    else:
        surge_level = "Critical"

    return {
        "expected_heat_stroke_cases": round(expected_cases, 1),
        "expected_admissions": round(expected_admissions, 1),
        "expected_icu_requirement": round(expected_icu, 1),
        "surge_risk_level": surge_level,
        "capacity_utilization_pct": round(capacity_utilization, 1),
    }
