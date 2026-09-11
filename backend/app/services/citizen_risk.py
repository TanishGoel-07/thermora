"""
Feature 1: Citizen Heat Risk Engine.

Wraps the core HTSI calculation with citizen-facing framing: a risk score,
category, plain-language recommended actions, and emergency guidance
specific to the person's profile (age, gender, occupation, medical
conditions, daily outdoor exposure).
"""
from __future__ import annotations

from dataclasses import dataclass

from app.services.thermal_stress import compute_htsi, HTSIResult

EMERGENCY_GUIDANCE = (
    "If you or someone nearby shows confusion, a body temperature above 40°C, "
    "hot/dry or clammy skin, a rapid pulse, or loses consciousness — this is "
    "heat stroke, a medical emergency. Call emergency services immediately, "
    "move the person to shade, remove excess clothing, and cool the body with "
    "water or ice packs on the neck, armpits, and groin while waiting for help."
)


@dataclass
class CitizenRiskResult:
    htsi: HTSIResult
    personalized_risk_score: float
    risk_category: str
    recommended_actions: list[str]
    emergency_guidance: str


def _occupation_multiplier(occupation: str | None) -> float:
    if not occupation:
        return 1.0
    occ = occupation.lower()
    high_risk_occupations = ("construction", "farmer", "farming", "delivery", "labourer", "laborer", "vendor", "police", "traffic")
    if any(k in occ for k in high_risk_occupations):
        return 1.08
    return 1.0


def assess_citizen_risk(
    temperature_c: float,
    humidity_pct: float,
    wind_speed_ms: float,
    solar_radiation_wm2: float,
    age: int | None,
    gender: str | None,
    occupation: str | None,
    has_chronic_condition: bool,
    daily_outdoor_exposure_hours: float,
) -> CitizenRiskResult:
    outdoor_worker = daily_outdoor_exposure_hours >= 4

    htsi = compute_htsi(
        temperature_c=temperature_c,
        humidity_pct=humidity_pct,
        wind_speed_ms=wind_speed_ms,
        solar_radiation_wm2=solar_radiation_wm2,
        age=age,
        occupation=occupation,
        has_chronic_condition=has_chronic_condition,
        outdoor_worker=outdoor_worker,
        gender=gender,
        daily_outdoor_exposure_hours=daily_outdoor_exposure_hours,
    )

    occ_multiplier = _occupation_multiplier(occupation)
    personalized_score = min(100.0, round(htsi.htsi_score * occ_multiplier, 1))

    actions = _recommended_actions(
        htsi.htsi_category, age, has_chronic_condition, daily_outdoor_exposure_hours, occupation
    )

    return CitizenRiskResult(
        htsi=htsi,
        personalized_risk_score=personalized_score,
        risk_category=htsi.htsi_category,
        recommended_actions=actions,
        emergency_guidance=EMERGENCY_GUIDANCE,
    )


def _recommended_actions(
    category: str,
    age: int | None,
    has_chronic_condition: bool,
    exposure_hours: float,
    occupation: str | None,
) -> list[str]:
    actions: list[str] = []

    if category == "Safe":
        actions.append("Conditions are safe. Maintain normal hydration and activity.")
    elif category == "Caution":
        actions += [
            "Drink water every 20-30 minutes even without feeling thirsty.",
            "Take shaded breaks if you're outdoors for extended periods.",
        ]
    elif category == "Danger":
        actions += [
            "Limit outdoor activity to before 10am or after 5pm.",
            "Wear light-colored, breathable clothing and a hat if outdoors.",
            "Check on elderly or unwell family members twice today.",
        ]
    else:  # Extreme Danger
        actions += [
            "Avoid all outdoor activity right now if possible.",
            "Move to an air-conditioned space or the nearest cooling center.",
            "Keep emergency rehydration salts (ORS) on hand.",
        ]

    if age is not None and (age >= 65 or age <= 5):
        actions.append("Age-based sensitivity detected — extra caution and frequent hydration advised.")
    if has_chronic_condition:
        actions.append("Existing health conditions increase heat risk — keep medication and water accessible.")
    if exposure_hours >= 4:
        actions.append(
            "High outdoor exposure detected — follow mandated work-rest cycles "
            "(e.g. 15 min shade break every hour above Danger level)."
        )
    if occupation and any(
        k in occupation.lower() for k in ("construction", "farmer", "farming", "delivery", "vendor")
    ):
        actions.append("Your occupation carries elevated heat exposure — inform your supervisor of heat-safety needs.")

    return actions
