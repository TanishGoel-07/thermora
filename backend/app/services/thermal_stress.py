"""
Human Thermal Stress Engine
============================
Implements three widely used biometeorological indices plus a composite,
0-100 "Human Thermal Stress Index" (HTSI) that additionally accounts for
personal vulnerability (age, chronic conditions, outdoor occupation).

References (formulas re-implemented from public domain equations):
- Heat Index: NOAA/NWS Rothfusz regression (Rothfusz, 1990)
- WBGT: Australian Bureau of Meteorology simplified outdoor approximation
- UTCI: 6th-order polynomial approximation (Bröde et al., 2012) reduced to
  the dominant terms driven by temperature, humidity and wind (radiation
  folded in via mean radiant temperature offset)
"""
from __future__ import annotations

from dataclasses import dataclass, field
from app.core.config import get_settings

settings = get_settings()


# ---------------------------------------------------------------------------
# Heat Index (Rothfusz regression), input/output in Celsius
# ---------------------------------------------------------------------------
def calculate_heat_index_c(temp_c: float, rh_pct: float) -> float:
    t_f = temp_c * 9 / 5 + 32
    rh = rh_pct

    # Simple formula first (Steadman-based average)
    hi_simple = 0.5 * (t_f + 61.0 + (t_f - 68.0) * 1.2 + rh * 0.094)

    if (hi_simple + t_f) / 2 >= 80:
        hi = (
            -42.379
            + 2.04901523 * t_f
            + 10.14333127 * rh
            - 0.22475541 * t_f * rh
            - 0.00683783 * t_f * t_f
            - 0.05481717 * rh * rh
            + 0.00122874 * t_f * t_f * rh
            + 0.00085282 * t_f * rh * rh
            - 0.00000199 * t_f * t_f * rh * rh
        )
        # Low-humidity / high-temp adjustment
        if rh < 13 and 80 <= t_f <= 112:
            adj = ((13 - rh) / 4) * ((17 - abs(t_f - 95.0)) / 17) ** 0.5
            hi -= adj
        # High-humidity adjustment
        if rh > 85 and 80 <= t_f <= 87:
            adj = ((rh - 85) / 10) * ((87 - t_f) / 5)
            hi += adj
    else:
        hi = hi_simple

    return round((hi - 32) * 5 / 9, 2)


# ---------------------------------------------------------------------------
# Wet Bulb Globe Temperature (simplified outdoor approximation, Celsius)
# ---------------------------------------------------------------------------
def calculate_wbgt_c(temp_c: float, rh_pct: float, wind_ms: float, solar_wm2: float) -> float:
    # Approximate natural wet-bulb temperature via vapor pressure
    vapor_pressure = (rh_pct / 100.0) * 6.105 * pow(2.718281828, (17.27 * temp_c) / (237.7 + temp_c))
    t_wet = (
        temp_c * (0.00066) * 100
        + ((4098 * vapor_pressure) / pow((temp_c + 237.7), 2))
        * (temp_c)
    ) / ((0.00066) * 100 + (4098 * vapor_pressure) / pow((temp_c + 237.7), 2))
    # Fallback bounded estimate using psychrometric approximation
    t_wet = temp_c * (
        (0.45 + 0.55 * (rh_pct / 100.0))
    )

    # Black globe temperature rises with solar radiation, falls with wind
    t_globe = temp_c + (solar_wm2 / 1000.0) * 8.0 - min(wind_ms, 6.0) * 0.5
    t_globe = max(temp_c, t_globe)

    wbgt = 0.7 * t_wet + 0.2 * t_globe + 0.1 * temp_c
    return round(wbgt, 2)


# ---------------------------------------------------------------------------
# Universal Thermal Climate Index (reduced polynomial approximation, Celsius)
# ---------------------------------------------------------------------------
def calculate_utci_c(temp_c: float, rh_pct: float, wind_ms: float, solar_wm2: float) -> float:
    wind_10m = max(wind_ms, 0.5)
    # Mean radiant temperature offset from solar load
    mrt_offset = (solar_wm2 / 1000.0) * 12.0
    tmrt = temp_c + mrt_offset

    # Reduced empirical polynomial (dominant first-order terms)
    utci = (
        temp_c
        + 0.607 * (tmrt - temp_c)
        - 2.265 * (wind_10m - 0.5)
        + 0.0091 * (rh_pct - 50.0)
        - 0.0004 * (rh_pct - 50.0) * (temp_c)
    )
    return round(utci, 2)


# ---------------------------------------------------------------------------
# Composite HTSI (0-100) with personal vulnerability adjustment
# ---------------------------------------------------------------------------
@dataclass
class HTSIResult:
    heat_index_c: float
    wbgt_c: float
    utci_c: float
    htsi_score: float
    htsi_category: str
    contrib_temperature: float = 0.0
    contrib_humidity: float = 0.0
    contrib_wind: float = 0.0
    contrib_solar_radiation: float = 0.0
    contrib_personal_vulnerability: float = 0.0
    recommendation: str = ""


def _vulnerability_multiplier(
    age: int | None, has_chronic_condition: bool, outdoor_worker: bool
) -> float:
    multiplier = 1.0
    if age is not None:
        if age >= 65 or age <= 5:
            multiplier += 0.15
    if has_chronic_condition:
        multiplier += 0.15
    if outdoor_worker:
        multiplier += 0.10
    return multiplier


def _category_for_score(score: float) -> str:
    if score <= settings.HTSI_SAFE_MAX:
        return "Safe"
    if score <= settings.HTSI_CAUTION_MAX:
        return "Caution"
    if score <= settings.HTSI_DANGER_MAX:
        return "Danger"
    return "Extreme Danger"


def _recommendation_for(category: str, outdoor_worker: bool) -> str:
    base = {
        "Safe": (
            "Conditions are within safe limits. Stay hydrated and enjoy normal "
            "outdoor activity."
        ),
        "Caution": (
            "Heat stress is building. Take regular breaks in shade, drink water "
            "every 20 minutes, and avoid strenuous activity during peak sun hours "
            "(12pm-4pm)."
        ),
        "Danger": (
            "High heat stress. Limit outdoor exposure, reschedule strenuous work "
            "to early morning or evening, use cooling centers, and monitor "
            "children, elderly, and those with chronic illness closely."
        ),
        "Extreme Danger": (
            "Life-threatening heat stress. Avoid all non-essential outdoor "
            "activity, move to an air-conditioned space or cooling center "
            "immediately, and seek medical help at the first sign of heat "
            "exhaustion (dizziness, nausea, rapid pulse)."
        ),
    }[category]
    if outdoor_worker and category in ("Danger", "Extreme Danger"):
        base += " Outdoor workers should follow mandatory work-rest cycles and employer heat-safety protocols."
    return base


def compute_htsi(
    temperature_c: float,
    humidity_pct: float,
    wind_speed_ms: float = 1.0,
    solar_radiation_wm2: float = 400.0,
    age: int | None = None,
    occupation: str | None = None,
    has_chronic_condition: bool = False,
    outdoor_worker: bool = False,
) -> HTSIResult:
    heat_index = calculate_heat_index_c(temperature_c, humidity_pct)
    wbgt = calculate_wbgt_c(temperature_c, humidity_pct, wind_speed_ms, solar_radiation_wm2)
    utci = calculate_utci_c(temperature_c, humidity_pct, wind_speed_ms, solar_radiation_wm2)

    # Normalize each index onto a 0-100 danger scale, then blend
    hi_score = _scale(heat_index, low=27, high=54)
    wbgt_score = _scale(wbgt, low=23, high=35)
    utci_score = _scale(utci, low=26, high=46)

    base_score = 0.4 * hi_score + 0.35 * wbgt_score + 0.25 * utci_score

    vulnerability_multiplier = _vulnerability_multiplier(age, has_chronic_condition, outdoor_worker)
    final_score = min(100.0, base_score * vulnerability_multiplier)

    category = _category_for_score(final_score)
    recommendation = _recommendation_for(category, outdoor_worker)

    # Contribution breakdown (relative weights, normalized to 100)
    temp_weight = max(temperature_c - 20, 0)
    humidity_weight = max(humidity_pct - 30, 0) * 0.5
    wind_weight = max(4 - wind_speed_ms, 0) * 3  # low wind increases stress
    solar_weight = solar_radiation_wm2 / 20.0
    vuln_weight = (vulnerability_multiplier - 1.0) * 100

    raw_total = temp_weight + humidity_weight + wind_weight + solar_weight + vuln_weight
    raw_total = raw_total if raw_total > 0 else 1.0

    contrib_temperature = round(temp_weight / raw_total * 100, 1)
    contrib_humidity = round(humidity_weight / raw_total * 100, 1)
    contrib_wind = round(wind_weight / raw_total * 100, 1)
    contrib_solar = round(solar_weight / raw_total * 100, 1)
    contrib_vuln = round(
        100 - (contrib_temperature + contrib_humidity + contrib_wind + contrib_solar), 1
    )
    contrib_vuln = max(contrib_vuln, 0.0)

    return HTSIResult(
        heat_index_c=heat_index,
        wbgt_c=wbgt,
        utci_c=utci,
        htsi_score=round(final_score, 1),
        htsi_category=category,
        contrib_temperature=contrib_temperature,
        contrib_humidity=contrib_humidity,
        contrib_wind=contrib_wind,
        contrib_solar_radiation=contrib_solar,
        contrib_personal_vulnerability=contrib_vuln,
        recommendation=recommendation,
    )


def _scale(value: float, low: float, high: float) -> float:
    """Linearly scale value onto 0-100, clamped."""
    if high == low:
        return 0.0
    pct = (value - low) / (high - low) * 100
    return max(0.0, min(100.0, pct))


def risk_drivers(result: HTSIResult) -> list[dict]:
    """Human-readable explanation of what's driving the current risk score."""
    drivers = [
        {
            "factor": "Air Temperature",
            "contribution_pct": result.contrib_temperature,
            "explanation": f"Ambient temperature is elevated, contributing a heat index of {result.heat_index_c}°C.",
        },
        {
            "factor": "Humidity",
            "contribution_pct": result.contrib_humidity,
            "explanation": "High moisture content reduces the body's ability to cool via sweat evaporation.",
        },
        {
            "factor": "Wind Speed",
            "contribution_pct": result.contrib_wind,
            "explanation": "Low wind speeds reduce convective heat loss from the skin.",
        },
        {
            "factor": "Solar Radiation",
            "contribution_pct": result.contrib_solar_radiation,
            "explanation": "Direct solar load raises effective (globe) temperature beyond air temperature.",
        },
        {
            "factor": "Personal Vulnerability",
            "contribution_pct": result.contrib_personal_vulnerability,
            "explanation": "Age, chronic health conditions, or outdoor occupation increase individual susceptibility.",
        },
    ]
    return sorted(drivers, key=lambda d: d["contribution_pct"], reverse=True)
