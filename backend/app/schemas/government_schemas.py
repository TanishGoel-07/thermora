from typing import Optional
from pydantic import BaseModel


class HighRiskAreaOut(BaseModel):
    ward_id: int
    ward_name: str
    htsi_score: float
    severity: str
    population: int
    elderly_population_pct: float


class HospitalCapacitySummaryOut(BaseModel):
    total_hospitals: int
    total_beds: int
    available_beds: int
    total_icu_beds: int
    available_icu_beds: int
    overall_utilization_pct: float


class CoolingCapacitySummaryOut(BaseModel):
    total_centers: int
    total_capacity: int
    total_occupancy: int
    utilization_pct: float


class DistrictOverviewOut(BaseModel):
    district_id: int
    district_name: str
    state_name: str
    heatwave_severity: str
    average_htsi_score: float
    high_risk_areas: list[HighRiskAreaOut]
    vulnerable_population_estimate: int
    hospital_capacity: HospitalCapacitySummaryOut
    cooling_center_capacity: CoolingCapacitySummaryOut
    emergency_recommendations: list[str]


class StateOverviewOut(BaseModel):
    state_id: int
    state_name: str
    district_summaries: list[DistrictOverviewOut]
    statewide_average_htsi: float
    total_vulnerable_population: int
