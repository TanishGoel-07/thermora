const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
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

export interface District {
  id: number;
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
  districts: () => request<District[]>("/geo/districts"),
  wards: (districtId?: number) =>
    request<Ward[]>(`/geo/wards${districtId ? `?district_id=${districtId}` : ""}`),
  ward: (id: number) => request<Ward>(`/geo/wards/${id}`),

  kpis: () => request<KPI>("/dashboard/kpis"),
  activeAlert: () => request<Alert | null>("/dashboard/active-alert"),
  topRiskWards: (limit = 5) => request<WardRisk[]>(`/dashboard/top-risk-wards?limit=${limit}`),

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

  alerts: (activeOnly = false) =>
    request<Alert[]>(`/alerts?active_only=${activeOnly}`),
  dismissAlert: (id: number) => request<Alert>(`/alerts/${id}/dismiss`, { method: "POST" }),

  wardHeatmap: () => request<GeoJSONFeatureCollection>("/gis/wards/heatmap"),
  uhiHotspots: () => request<GeoJSONFeatureCollection>("/gis/hotspots"),

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

  wardWeather: (wardId: number, limit = 30) =>
    request<WeatherObservation[]>(`/weather/ward/${wardId}?limit=${limit}`),

  generalTips: () => request<{ tips: string[] }>("/health-guidance/general-tips"),
  personalizedGuidance: (payload: Record<string, unknown>) =>
    request<ThermalStressResult>("/health-guidance/personalized", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  thresholds: () =>
    request<{
      htsi_safe_max: number;
      htsi_caution_max: number;
      htsi_danger_max: number;
      alert_risk_threshold: number;
    }>("/settings/thresholds"),
  systemInfo: () => request<Record<string, unknown>>("/settings/system-info"),
};
