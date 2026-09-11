import { Users, ShieldCheck, ThermometerSun, Radio, Flame, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useKPIs, useFiveDayForecast, useCoolingCenters, useHospitalSurge } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";
import { riskColor } from "@/lib/utils";
import { ThermalGlobe } from "@/components/3d/ThermalGlobe";
import { RiskGauge } from "@/components/ui/RiskGauge";
import { SeverityBadge } from "@/components/ui/badge";

export function ExecutiveHero() {
  const { selectedWardId, selectedWard } = useWardContext();
  const { data: kpi, isLoading: kpiLoading } = useKPIs(selectedWardId);
  const { data: forecast } = useFiveDayForecast(selectedWardId);
  const { data: coolingCenters } = useCoolingCenters({ wardId: selectedWardId });
  const { data: hospitalSurge } = useHospitalSurge(selectedWardId);

  if (!kpi || !selectedWard) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[340px]">
        <div className="panel animate-pulse h-full" />
        <div className="panel animate-pulse h-full" />
      </div>
    );
  }

  const color = riskColor(kpi.htsi_category);

  const peakDay =
    Array.isArray(forecast) && forecast.length > 0
      ? forecast.reduce((max, d) => (d.risk_pct > max.risk_pct ? d : max), forecast[0])
      : null;

  const vulnerableEstimate = Math.round(
    selectedWard.population * (selectedWard.elderly_population_pct + 0.05)
  );

  const coolingReadiness =
    Array.isArray(coolingCenters) && coolingCenters.length > 0
      ? Math.round(
          100 -
            (coolingCenters.reduce(
              (s, c) => s + (c.capacity ? c.current_occupancy / c.capacity : 1),
              0
            ) /
              coolingCenters.length) *
              100
        )
      : null;

  const bedReadiness =
    Array.isArray(hospitalSurge) && hospitalSurge.length > 0
      ? Math.round(
          100 -
            hospitalSurge.reduce((s, h) => s + h.capacity_utilization_pct, 0) /
              hospitalSurge.length
        )
      : null;

  const readinessSegments = [
    coolingReadiness !== null && {
      label: "Cooling Shelters",
      value: Math.max(0, coolingReadiness),
    },
    bedReadiness !== null && {
      label: "Hospital Beds",
      value: Math.max(0, bedReadiness),
    },
  ].filter(Boolean) as { label: string; value: number }[];

  const overallReadiness =
    readinessSegments.length > 0
      ? Math.round(
          readinessSegments.reduce((s, r) => s + r.value, 0) / readinessSegments.length
        )
      : 84;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
      {/* 3D Satellite Earth Centerpiece (Left 5 cols on XL) */}
      <div className="xl:col-span-5 h-full">
        <ThermalGlobe
          htsiScore={kpi.htsi_score}
          wardName={`${selectedWard.name} Ward #${selectedWard.ward_number}`}
        />
      </div>

      {/* Hero Live Instrument & Readiness Card (Right 7 cols on XL) */}
      <div
        className="xl:col-span-7 relative overflow-hidden rounded-xl2 bg-base-900/90 border border-base-750/80 shadow-panel backdrop-blur-md p-5 sm:p-6 flex flex-col justify-between"
        style={{ borderLeft: `3px solid ${color}` }}
      >
        {/* Subtle Ambient Radial Glow */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 w-80 h-80 rounded-full opacity-[0.12] blur-3xl"
          style={{ background: color }}
        />

        {/* Top Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-750/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: color }}
              />
              <span className="mono-label text-slate-400">
                Live Heat Stress Telemetry
              </span>
            </div>
            <h2 className="font-display font-bold text-xl sm:text-2xl text-white tracking-tight mt-1 flex items-center gap-2.5">
              <span>{selectedWard.name}</span>
              <SeverityBadge label={kpi.htsi_category} />
            </h2>
          </div>

          {peakDay && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-base-950/80 border border-base-750/80">
              <ThermometerSun size={14} className="text-ember-400 shrink-0" />
              <div className="text-[11px] font-mono leading-tight">
                <span className="text-slate-400">Peak Forecast: </span>
                <span className="text-ember-400 font-bold data-num">
                  {peakDay.risk_pct.toFixed(0)}%
                </span>
                <span className="text-slate-500"> on {peakDay.day_label}</span>
              </div>
            </div>
          )}
        </div>

        {/* Mid Row: Signature Animated Risk Gauge + Quick Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 my-4 items-center">
          {/* Circular Animated SVG Risk Gauge */}
          <div className="sm:col-span-5 flex justify-center">
            <RiskGauge
              score={kpi.htsi_score}
              category={kpi.htsi_category}
              label="HTSI INDEX"
              size={176}
            />
          </div>

          {/* Quick Metrics Quad */}
          <div className="sm:col-span-7 grid grid-cols-2 gap-2.5">
            <MetricCard
              icon={<Users className="w-3.5 h-3.5 text-cyber-cyan" />}
              label="Population"
              value={selectedWard.population.toLocaleString()}
              caption="In ward boundary"
            />
            <MetricCard
              icon={<Radio className="w-3.5 h-3.5 text-amber-400" />}
              label="Vulnerable"
              value={vulnerableEstimate.toLocaleString()}
              caption="High medical risk"
            />
            <MetricCard
              icon={<ThermometerSun className="w-3.5 h-3.5 text-ember-400" />}
              label="Feels Like"
              value={`${kpi.heat_index_c.toFixed(1)}°C`}
              caption="Heat index value"
            />
            <MetricCard
              icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
              label="Readiness"
              value={`${overallReadiness}%`}
              caption="Shelter & bed buffer"
            />
          </div>
        </div>

        {/* Bottom Readiness Meter Strip */}
        <div className="pt-3 border-t border-base-750/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <span className="text-slate-400 shrink-0 flex items-center gap-1.5">
              <Activity size={13} className="text-ember-400" />
              <span>Grid Status:</span>
            </span>
            <div className="flex items-center gap-3 flex-1 sm:flex-initial">
              {readinessSegments.map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">{s.label}:</span>
                  <div className="w-16 h-1.5 rounded-full bg-base-800 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${s.value}%`,
                        backgroundColor: s.value >= 70 ? "#10B981" : s.value >= 40 ? "#F59E0B" : "#EF4444",
                      }}
                    />
                  </div>
                  <span className="data-num text-slate-300 font-bold text-[11px]">
                    {s.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <span className="text-slate-500 text-[10px] hidden md:inline shrink-0">
            NASA POWER · Live Ingestion
          </span>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  caption,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="p-2.5 rounded-lg bg-base-950/60 border border-base-750/70 hover:border-base-700 transition-colors">
      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
        {icon}
        <span className="mono-label text-[9px] text-slate-400">{label}</span>
      </div>
      <div className="data-num text-lg sm:text-xl font-bold text-white leading-none">
        {value}
      </div>
      <div className="text-[10px] text-slate-500 mt-1 truncate">{caption}</div>
    </div>
  );
}
