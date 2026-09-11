import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

const REFRESH_MS = 60_000;

export function useStates() {
  return useQuery({ queryKey: ["states"], queryFn: api.states });
}

export function useDistricts(stateId?: number) {
  return useQuery({
    queryKey: ["districts", stateId],
    queryFn: () => api.districts(stateId),
    enabled: !!stateId,
  });
}

export function useWards(districtId?: number) {
  return useQuery({
    queryKey: ["wards", districtId],
    queryFn: () => api.wards(districtId),
    enabled: !!districtId,
  });
}

export function useKPIs(wardId: number | undefined) {
  return useQuery({
    queryKey: ["kpis", wardId],
    queryFn: () => api.kpis(wardId as number),
    enabled: !!wardId,
    refetchInterval: REFRESH_MS,
  });
}

export function useActiveAlert(wardId: number | undefined) {
  return useQuery({
    queryKey: ["active-alert", wardId],
    queryFn: () => api.activeAlert(wardId as number),
    enabled: !!wardId,
    refetchInterval: REFRESH_MS,
  });
}

export function useTopRiskWards(limit = 5, districtId?: number) {
  return useQuery({
    queryKey: ["top-risk-wards", limit, districtId],
    queryFn: () => api.topRiskWards(limit, districtId),
    refetchInterval: REFRESH_MS,
  });
}

export function useFiveDayForecast(wardId: number | undefined) {
  return useQuery({
    queryKey: ["forecast", wardId],
    queryFn: () => api.fiveDayForecast(wardId as number),
    enabled: !!wardId,
  });
}

export function useLatestEnsemblePrediction(wardId: number | undefined) {
  return useQuery({
    queryKey: ["latest-ensemble", wardId],
    queryFn: () => api.latestEnsemblePrediction(wardId as number),
    enabled: !!wardId,
  });
}

export function useWardBreakdown(wardId: number | undefined) {
  return useQuery({
    queryKey: ["breakdown", wardId],
    queryFn: () => api.wardThermalBreakdown(wardId as number),
    enabled: !!wardId,
  });
}

export function useWardThermalLatest(wardId: number | undefined) {
  return useQuery({
    queryKey: ["thermal-latest", wardId],
    queryFn: () => api.wardThermalLatest(wardId as number),
    enabled: !!wardId,
  });
}

export function useWardHeatmap() {
  return useQuery({
    queryKey: ["ward-heatmap"],
    queryFn: api.wardHeatmap,
    refetchInterval: REFRESH_MS,
  });
}

export function useHospitalSurge(wardId?: number) {
  return useQuery({
    queryKey: ["hospital-surge", wardId],
    queryFn: () => api.hospitalSurge(wardId),
  });
}

export function useHospitals(wardId?: number) {
  return useQuery({ queryKey: ["hospitals", wardId], queryFn: () => api.hospitals(wardId) });
}

export function useCoolingCenters(params?: { lat?: number; lon?: number; wardId?: number }) {
  return useQuery({
    queryKey: ["cooling-centers", params],
    queryFn: () => api.coolingCenters(params),
  });
}

export function useWardWeather(wardId: number | undefined, limit = 30) {
  return useQuery({
    queryKey: ["ward-weather", wardId, limit],
    queryFn: () => api.wardWeather(wardId as number, limit),
    enabled: !!wardId,
  });
}

export function useAlerts(activeOnly = false) {
  return useQuery({ queryKey: ["alerts", activeOnly], queryFn: () => api.alerts(activeOnly) });
}

export function useGeneralTips() {
  return useQuery({ queryKey: ["general-tips"], queryFn: api.generalTips });
}

export function useHeatwaveExplanation(wardId: number | undefined) {
  return useQuery({
    queryKey: ["explain-heatwave", wardId],
    queryFn: () => api.explainHeatwave(wardId as number),
    enabled: !!wardId,
  });
}
