from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class WardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    district_id: int
    name: str
    ward_number: int
    population: int
    population_density: float
    vegetation_index: float
    impervious_surface_pct: float
    elderly_population_pct: float
    centroid_lat: float
    centroid_lon: float


class StateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    code: str
    population: int
    centroid_lat: float
    centroid_lon: float


class DistrictOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    state_id: int
    name: str
    state: str
    population: int
    centroid_lat: float
    centroid_lon: float


class WeatherObservationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    ward_id: Optional[int] = None
    observed_date: datetime
    temperature_c: float
    temperature_max_c: Optional[float] = None
    temperature_min_c: Optional[float] = None
    humidity_pct: float
    wind_speed_ms: float
    solar_radiation_wm2: float
    pressure_kpa: Optional[float] = None
    rainfall_mm: Optional[float] = None


class ThermalStressInput(BaseModel):
    temperature_c: float
    humidity_pct: float
    wind_speed_ms: float = 1.0
    solar_radiation_wm2: float = 400.0
    age: Optional[int] = None
    occupation: Optional[str] = None
    has_chronic_condition: bool = False
    outdoor_worker: bool = False


class ThermalStressOut(BaseModel):
    heat_index_c: float
    wbgt_c: float
    utci_c: float
    htsi_score: float
    htsi_category: str
    contrib_temperature: float
    contrib_humidity: float
    contrib_wind: float
    contrib_solar_radiation: float
    contrib_personal_vulnerability: float
    recommendation: str


class WardRiskOut(BaseModel):
    ward_id: int
    ward_name: str
    rank: int
    risk_score: float
    severity: str
    htsi_score: float
    heat_index_c: float


class ForecastDayOut(BaseModel):
    date: datetime
    day_label: str
    risk_pct: float
    severity: str
    heatwave_probability: float
    estimated_duration_days: float


class KPIOut(BaseModel):
    current_heat_risk: float
    current_heat_risk_level: str
    htsi_score: float
    htsi_category: str
    heat_index_c: float
    wbgt_c: float
    utci_c: float


class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    ward_id: int
    level: str
    htsi_score: float
    title: str
    message: str
    recommended_action: str
    is_active: bool
    created_at: datetime


class HospitalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    ward_id: int
    name: str
    type: str
    total_beds: int
    icu_beds: int
    available_beds: int
    available_icu_beds: int
    latitude: float
    longitude: float
    contact_number: Optional[str] = None


class HospitalPredictionOut(BaseModel):
    hospital_id: int
    hospital_name: str
    predicted_for_date: datetime
    expected_heat_stroke_cases: float
    expected_admissions: float
    expected_icu_requirement: float
    expected_opd_demand: float
    projected_bed_occupancy_pct: float
    emergency_resource_score: float
    surge_risk_level: str
    capacity_utilization_pct: float


class CoolingCenterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    ward_id: int
    name: str
    type: str
    capacity: int
    current_occupancy: int
    has_ac: bool
    has_water: bool
    is_open_24h: bool
    latitude: float
    longitude: float
    address: Optional[str] = None
    distance_km: Optional[float] = None


class CitizenRiskInput(BaseModel):
    ward_id: Optional[int] = None
    temperature_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    wind_speed_ms: float = 1.5
    solar_radiation_wm2: float = 450.0
    age: Optional[int] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    has_chronic_condition: bool = False
    daily_outdoor_exposure_hours: float = 1.0


class CitizenRiskOut(BaseModel):
    personalized_risk_score: float
    risk_category: str
    heat_index_c: float
    wbgt_c: float
    utci_c: float
    recommended_actions: list[str]
    emergency_guidance: str


class RiskDriverOut(BaseModel):
    factor: str
    contribution_pct: float
    explanation: str


class HeatwavePredictionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    ward_id: int
    target_date: datetime
    horizon_days: int
    heatwave_probability: float
    severity_score: float
    severity_level: str
    estimated_duration_days: float
    xgb_probability: Optional[float] = None
    rf_probability: Optional[float] = None
    lstm_probability: Optional[float] = None
