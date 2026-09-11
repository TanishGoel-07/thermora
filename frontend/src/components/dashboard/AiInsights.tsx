import { Sparkles, TrendingUp, AlertCircle, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { useHeatwaveExplanation, useHospitalSurge, useCoolingCenters } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";
import { riskColor } from "@/lib/utils";

interface Insight {
  tag: string;
  metricLabel: string;
  metricValue: number;
  severity: string;
  headline: string;
  body: string;
}

export function AiInsights() {
  const { selectedWardId } = useWardContext();
  const { data: explanation } = useHeatwaveExplanation(selectedWardId);
  const { data: hospitalSurge } = useHospitalSurge(selectedWardId);
  const { data: coolingCenters } = useCoolingCenters({ wardId: selectedWardId });

  const insights: Insight[] = [];

  if (explanation && typeof explanation.heatwave_probability === "number") {
    const topContributor = Array.isArray(explanation.contributors)
      ? explanation.contributors[0]
      : undefined;
    insights.push({
      tag: "AI FORECAST",
      metricLabel: "Probability",
      metricValue: explanation.heatwave_probability,
      severity: explanation.severity_level,
      headline: `Heatwave probability projected at ${explanation.heatwave_probability.toFixed(0)}%`,
      body: topContributor
        ? `${topContributor.factor} is the leading driver, contributing ${topContributor.direction_pct >= 0 ? "+" : ""}${topContributor.direction_pct.toFixed(0)}% to the ensemble risk assessment.`
        : "Ensemble model prediction for this ward.",
    });
  }

  if (Array.isArray(hospitalSurge) && hospitalSurge.length > 0) {
    const busiest = hospitalSurge.reduce(
      (max, h) => (h.capacity_utilization_pct > max.capacity_utilization_pct ? h : max),
      hospitalSurge[0]
    );
    insights.push({
      tag: "HEALTH SYSTEM",
      metricLabel: "Capacity Load",
      metricValue: busiest.capacity_utilization_pct,
      severity: busiest.surge_risk_level,
      headline: `${busiest.hospital_name} at ${busiest.capacity_utilization_pct.toFixed(0)}% load`,
      body: `Estimated ${busiest.expected_admissions.toFixed(0)} admissions and ${busiest.expected_icu_requirement.toFixed(0)} ICU admissions projected in this heat cycle.`,
    });
  }

  if (Array.isArray(coolingCenters) && coolingCenters.length > 0) {
    const busiest = coolingCenters.reduce(
      (max, c) =>
        c.current_occupancy / (c.capacity || 1) > max.current_occupancy / (max.capacity || 1)
          ? c
          : max,
      coolingCenters[0]
    );
    const occupancyPct = busiest.capacity
      ? (busiest.current_occupancy / busiest.capacity) * 100
      : 0;
    insights.push({
      tag: "RELIEF NETWORK",
      metricLabel: "Occupancy",
      metricValue: occupancyPct,
      severity: occupancyPct >= 80 ? "Danger" : occupancyPct >= 60 ? "Caution" : "Safe",
      headline: `${busiest.name} occupancy reaching ${occupancyPct.toFixed(0)}%`,
      body:
        occupancyPct >= 70
          ? "Pre-activation of secondary relief shelters and water supply tankers is recommended."
          : "Shelter capacity is currently adequate for expected citizen load.",
    });
  }

  if (insights.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
      {insights.map((ins, idx) => {
        const color = riskColor(ins.severity);
        return (
          <motion.article
            key={ins.tag}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.08 }}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="group relative flex flex-col justify-between rounded-xl border border-base-750/80 bg-base-900/90 p-4 shadow-panel transition-all hover:border-base-600"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-ember-500/10 border border-ember-500/30">
                  <Sparkles className="w-3 h-3 text-ember-400" />
                  <span className="mono-label text-ember-400 font-bold text-[9px]">{ins.tag}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                  <span className="text-slate-400 text-[10px]">{ins.metricLabel}</span>
                  <span className="font-bold data-num" style={{ color }}>
                    {ins.metricValue.toFixed(0)}%
                  </span>
                </span>
              </div>

              <h3 className="mt-3 flex items-start gap-2 font-display text-sm font-semibold text-slate-100 tracking-tight leading-snug">
                <TrendingUp className="mt-0.5 w-3.5 h-3.5 shrink-0" style={{ color }} />
                <span>{ins.headline}</span>
              </h3>

              <p className="mt-2 text-xs leading-relaxed text-slate-400">{ins.body}</p>
            </div>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-base-800">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(ins.metricValue, 100)}%`,
                  background: color,
                }}
              />
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
