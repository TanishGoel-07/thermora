const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---- Types --------------------------------------------------------------

export interface Ward {
  id: number;
  district_id: number;
  name: string;
  ward_number: number;
  population: number;
  population_density: number;
  vegetation_index: number;
  impervious_surface_pct: number;
  elderly_population_pct: number;
  centroid_lat: number;
  centroid_lon: number;
}

export interface State {
  id: number;
  name: string;
  code: string;
  population: number;
  centroid_lat: number;
  centroid_lon: number;
}

export interface District {
  id: number;
  state_id: number;
  name: string;
  state: string;
  population: number;
  centroid_lat: number;
  centroid_lon: number;
}

export interface KPI {
  current_heat_risk: number;
  current_heat_risk_level: string;
  htsi_score: number;
  htsi_category: string;
  heat_index_c: number;
  wbgt_c: number;
  utci_c: number;
}

export interface Alert {
  id: number;
  ward_id: number;
  level: string;
  htsi_score: number;
  title: string;
  message: string;
  recommended_action: string;
  is_active: boolean;
  created_at: string;
}

export interface WardRisk {
  ward_id: number;
  ward_name: string;
  rank: number;
  risk_score: number;
  severity: string;
  htsi_score: number;
  heat_index_c: number;
}

export interface ForecastDay {
  date: string;
  day_label: string;
  risk_pct: number;
  severity: string;
  heatwave_probability: number;
  estimated_duration_days: number;
}

export interface RiskDriver {
  factor: string;
  contribution_pct: number;
  explanation: string;
}

export interface ThermalStressResult {
  heat_index_c: number;
  wbgt_c: number;
  utci_c: number;
  htsi_score: number;
  htsi_category: string;
  contrib_temperature: number;
  contrib_humidity: number;
  contrib_wind: number;
  contrib_solar_radiation: number;
  contrib_personal_vulnerability: number;
  recommendation: string;
}

export interface HospitalPrediction {
  hospital_id: number;
  hospital_name: string;
  predicted_for_date: string;
  expected_heat_stroke_cases: number;
  expected_admissions: number;
  expected_icu_requirement: number;
  expected_opd_demand: number;
  projected_bed_occupancy_pct: number;
  emergency_resource_score: number;
  surge_risk_level: string;
  capacity_utilization_pct: number;
}

export interface CoolingCenter {
  id: number;
  ward_id: number;
  name: string;
  type: string;
  capacity: number;
  current_occupancy: number;
  has_ac: boolean;
  has_water: boolean;
  is_open_24h: boolean;
  latitude: number;
  longitude: number;
  address?: string;
  distance_km?: number;
}

export interface Hospital {
  id: number;
  ward_id: number;
  name: string;
  type: string;
  total_beds: number;
  icu_beds: number;
  available_beds: number;
  available_icu_beds: number;
  latitude: number;
  longitude: number;
  contact_number?: string;
}

export interface WeatherObservation {
  id: number;
  ward_id?: number;
  observed_date: string;
  temperature_c: number;
  temperature_max_c?: number;
  temperature_min_c?: number;
  humidity_pct: number;
  wind_speed_ms: number;
  solar_radiation_wm2: number;
}

export interface CitizenRiskResult {
  personalized_risk_score: number;
  risk_category: string;
  heat_index_c: number;
  wbgt_c: number;
  utci_c: number;
  recommended_actions: string[];
  emergency_guidance: string;
}

export interface Contributor {
  factor: string;
  direction_pct: number;
  explanation: string;
}

export interface HeatwaveExplanation {
  heatwave_probability: number;
  severity_level: string;
  contributors: Contributor[];
}

export interface HeatwavePredictionOut {
  ward_id: number;
  target_date: string;
  horizon_days: number;
  heatwave_probability: number;
  severity_score: number;
  severity_level: string;
  estimated_duration_days: number;
  xgb_probability?: number | null;
  rf_probability?: number | null;
  lstm_probability?: number | null;
}

export interface HighRiskArea {
  ward_id: number;
  ward_name: string;
  htsi_score: number;
  severity: string;
  population: number;
  elderly_population_pct: number;
}

export interface HospitalCapacitySummary {
  total_hospitals: number;
  total_beds: number;
  available_beds: number;
  total_icu_beds: number;
  available_icu_beds: number;
  overall_utilization_pct: number;
}

export interface CoolingCapacitySummary {
  total_centers: number;
  total_capacity: number;
  total_occupancy: number;
  utilization_pct: number;
}

export interface DistrictOverview {
  district_id: number;
  district_name: string;
  state_name: string;
  heatwave_severity: string;
  average_htsi_score: number;
  high_risk_areas: HighRiskArea[];
  vulnerable_population_estimate: number;
  hospital_capacity: HospitalCapacitySummary;
  cooling_center_capacity: CoolingCapacitySummary;
  emergency_recommendations: string[];
}

export interface StateOverview {
  state_id: number;
  state_name: string;
  district_summaries: DistrictOverview[];
  statewide_average_htsi: number;
  total_vulnerable_population: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  role: string;
  user_id: string;
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: { type: string; coordinates: any };
    properties: Record<string, any>;
  }>;
}

// ---- API surface ----------------------------------------------------------

export const api = {
  states: () => request<State[]>("/geo/states"),
  districts: (stateId?: number) =>
    request<District[]>(`/geo/districts${stateId ? `?state_id=${stateId}` : ""}`),
  wards: (districtId?: number, stateId?: number) => {
    const qs = new URLSearchParams();
    if (districtId !== undefined) qs.set("district_id", String(districtId));
    else if (stateId !== undefined) qs.set("state_id", String(stateId));
    const query = qs.toString();
    return request<Ward[]>(`/geo/wards${query ? `?${query}` : ""}`);
  },
  ward: (id: number) => request<Ward>(`/geo/wards/${id}`),

  kpis: (wardId: number) => request<KPI>(`/dashboard/kpis?ward_id=${wardId}`),
  activeAlert: (wardId: number) => request<Alert | null>(`/dashboard/active-alert?ward_id=${wardId}`),
  topRiskWards: (limit = 5, districtId?: number) =>
    request<WardRisk[]>(
      `/dashboard/top-risk-wards?limit=${limit}${districtId ? `&district_id=${districtId}` : ""}`
    ),

  thermalCompute: (payload: Record<string, unknown>) =>
    request<ThermalStressResult>("/thermal/compute", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  wardThermalLatest: (wardId: number) =>
    request<ThermalStressResult>(`/thermal/ward/${wardId}/latest`),
  wardThermalBreakdown: (wardId: number) =>
    request<RiskDriver[]>(`/thermal/ward/${wardId}/breakdown`),

  fiveDayForecast: (wardId: number) =>
    request<ForecastDay[]>(`/forecast/ward/${wardId}/5-day`),
  latestEnsemblePrediction: (wardId: number) =>
    request<HeatwavePredictionOut>(`/forecast/ward/${wardId}/latest-ensemble`),

  alerts: (activeOnly = false) =>
    request<Alert[]>(`/alerts?active_only=${activeOnly}`),
  dismissAlert: (id: number) => request<Alert>(`/alerts/${id}/dismiss`, { method: "POST" }),

  wardHeatmap: () => request<GeoJSONFeatureCollection>("/gis/wards/heatmap"),
  uhiHotspots: () => request<GeoJSONFeatureCollection>("/gis/hotspots"),
  analyzeUhi: (wardId: number, satellite: "synthetic" | "landsat8" = "synthetic") =>
    request(`/uhi/ward/${wardId}/analyze?satellite=${satellite}`, { method: "POST" }),

  hospitals: (wardId?: number) =>
    request<Hospital[]>(`/hospitals${wardId ? `?ward_id=${wardId}` : ""}`),
  hospitalSurge: (wardId?: number) =>
    request<HospitalPrediction[]>(`/hospitals/surge-predictions${wardId ? `?ward_id=${wardId}` : ""}`),

  coolingCenters: (params?: { lat?: number; lon?: number; wardId?: number }) => {
    const qs = new URLSearchParams();
    if (params?.lat !== undefined) qs.set("lat", String(params.lat));
    if (params?.lon !== undefined) qs.set("lon", String(params.lon));
    if (params?.wardId !== undefined) qs.set("ward_id", String(params.wardId));
    const query = qs.toString();
    return request<CoolingCenter[]>(`/cooling-centers${query ? `?${query}` : ""}`);
  },
  recommendCoolingCenter: (lat: number, lon: number, radiusKm = 5) =>
    request(`/cooling-centers/recommend?lat=${lat}&lon=${lon}&radius_km=${radiusKm}`),

  wardWeather: (wardId: number, limit = 30) =>
    request<WeatherObservation[]>(`/weather/ward/${wardId}?limit=${limit}`),

  generalTips: () => request<{ tips: string[] }>("/health-guidance/general-tips"),
  personalizedGuidance: (payload: Record<string, unknown>) =>
    request<ThermalStressResult>("/health-guidance/personalized", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  citizenRiskAssessment: (payload: Record<string, unknown>) =>
    request<CitizenRiskResult>("/citizen/risk-assessment", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  explainHeatwave: (wardId: number) =>
    request<HeatwaveExplanation>(`/explainability/ward/${wardId}/heatwave`),
  explainHtsi: (wardId: number) => request<RiskDriver[]>(`/explainability/ward/${wardId}/htsi`),

  districtGovernmentOverview: (districtId: number, token: string) =>
    request<DistrictOverview>(`/government/district/${districtId}/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  stateGovernmentOverview: (stateId: number, token: string) =>
    request<StateOverview>(`/government/state/${stateId}/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  login: (email: string, password: string) =>
    request<TokenResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (payload: Record<string, unknown>) =>
    request<TokenResponse>("/auth/register", { method: "POST", body: JSON.stringify(payload) }),

  thresholds: () =>
    request<{
      htsi_safe_max: number;
      htsi_caution_max: number;
      htsi_danger_max: number;
      alert_risk_threshold: number;
    }>("/settings/thresholds"),
  systemInfo: () => request<Record<string, unknown>>("/settings/system-info"),
};
