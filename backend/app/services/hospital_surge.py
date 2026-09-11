"""
Predicts expected heat-stroke case load, hospital admissions, OPD demand,
ICU demand, projected bed occupancy, and an overall emergency-resource strain
score for a ward's hospitals given current/forecast thermal stress severity
and ward demographics (Feature 6: Hospital Surge Prediction).

Model: epidemiologically-inspired incidence-rate scaling. Not a substitute
for a calibrated regression model trained on real admissions data, but
produces directionally sound, explainable numbers out of the box, and is
structured so the constants below can be replaced with fitted coefficients
once real admissions data is available.
"""
from __future__ import annotations

from app.models.geography import Ward
from app.models.hospital import Hospital

# Baseline heat-stroke incidence per 100,000 population per day at HTSI=100
BASE_INCIDENCE_PER_100K = 8.0
ADMISSION_RATE = 0.35  # fraction of heat-stroke cases requiring admission
ICU_RATE = 0.12  # fraction of admissions requiring ICU
OPD_MULTIPLIER = 4.5  # heat-related OPD visits (dehydration, rashes, fatigue) per admitted case


def predict_hospital_surge(ward: Ward, hospital: Hospital, htsi_score: float) -> dict:
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
    expected_opd = expected_admissions * OPD_MULTIPLIER

    capacity_utilization = (
        (expected_admissions / hospital.available_beds) * 100 if hospital.available_beds else 100.0
    )
    capacity_utilization = min(capacity_utilization, 100.0)

    baseline_occupancy_pct = (
        ((hospital.total_beds - hospital.available_beds) / hospital.total_beds) * 100
        if hospital.total_beds
        else 0.0
    )
    projected_bed_occupancy_pct = min(100.0, baseline_occupancy_pct + capacity_utilization * 0.6)

    icu_strain = (
        (expected_icu / hospital.available_icu_beds) * 100 if hospital.available_icu_beds else 100.0
    )
    icu_strain = min(icu_strain, 100.0)

    # Composite 0-100 strain score blending bed, ICU, and OPD throughput pressure
    opd_capacity_proxy = max(hospital.total_beds * 3, 1)  # rough OPD throughput proxy
    opd_strain = min((expected_opd / opd_capacity_proxy) * 100, 100.0)
    emergency_resource_score = round(
        0.45 * projected_bed_occupancy_pct + 0.35 * icu_strain + 0.20 * opd_strain, 1
    )

    if emergency_resource_score < 40:
        surge_level = "Normal"
    elif emergency_resource_score < 70:
        surge_level = "Elevated"
    elif emergency_resource_score < 90:
        surge_level = "High"
    else:
        surge_level = "Critical"

    return {
        "expected_heat_stroke_cases": round(expected_cases, 1),
        "expected_admissions": round(expected_admissions, 1),
        "expected_icu_requirement": round(expected_icu, 1),
        "expected_opd_demand": round(expected_opd, 1),
        "projected_bed_occupancy_pct": round(projected_bed_occupancy_pct, 1),
        "emergency_resource_score": emergency_resource_score,
        "surge_risk_level": surge_level,
        "capacity_utilization_pct": round(capacity_utilization, 1),
    }
