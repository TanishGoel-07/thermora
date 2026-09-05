from __future__ import annotations

from fastapi import APIRouter

from app.schemas.schemas import ThermalStressInput, ThermalStressOut
from app.services.thermal_stress import compute_htsi

router = APIRouter(prefix="/health-guidance", tags=["health-guidance"])


GENERAL_TIPS = [
    "Drink water regularly even if you do not feel thirsty; avoid alcohol and excess caffeine.",
    "Wear lightweight, light-colored, loose-fitting clothing.",
    "Never leave children, elderly people, or pets in a parked vehicle.",
    "Check on elderly neighbors and relatives twice a day during heatwaves.",
    "Use ORS or homemade drinks (lemon water with a pinch of salt and sugar) to stay hydrated.",
    "Avoid strenuous outdoor activity between 12pm and 4pm.",
    "Recognize heat exhaustion symptoms: heavy sweating, weakness, dizziness, nausea. Move to a cool place and hydrate immediately.",
    "Recognize heat stroke symptoms (medical emergency): high body temperature, confusion, no sweating, rapid pulse. Call emergency services immediately.",
]


@router.get("/general-tips")
def get_general_tips():
    return {"tips": GENERAL_TIPS}


@router.post("/personalized", response_model=ThermalStressOut)
def get_personalized_guidance(payload: ThermalStressInput):
    result = compute_htsi(
        temperature_c=payload.temperature_c,
        humidity_pct=payload.humidity_pct,
        wind_speed_ms=payload.wind_speed_ms,
        solar_radiation_wm2=payload.solar_radiation_wm2,
        age=payload.age,
        occupation=payload.occupation,
        has_chronic_condition=payload.has_chronic_condition,
        outdoor_worker=payload.outdoor_worker,
    )
    return ThermalStressOut(**result.__dict__)
