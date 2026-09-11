import { Building2, HeartPulse, Bed, Stethoscope, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useHospitalSurge } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";
import { Panel } from "@/components/ui/panel";
import { SeverityBadge } from "@/components/ui/badge";

export function HospitalSurgePanel() {
  const { selectedWardId } = useWardContext();
  const { data: rawData, isLoading } = useHospitalSurge(selectedWardId);
  // API can be unreachable or return a non-array payload (e.g. an error
  // body) — always coerce to an array so we never call .map on non-arrays.
  const data = Array.isArray(rawData) ? rawData : [];

  return (
    <Panel
      eyebrow="Healthcare Capacity"
      title="Hospital ER Surge Projection"
      subtitle="Anticipated heat stroke admissions & ICU demand"
      icon={<Building2 className="w-4 h-4" />}
      ticks
      className="h-full"
    >
      <div className="p-4 flex flex-col justify-between h-full">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse bg-base-800/50 rounded-lg" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 font-mono">
            No hospitals registered within this ward perimeter.
          </div>
        ) : (
          <ul className="space-y-3">
            {data.map((h, i) => (
              <motion.li
                key={h.hospital_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                className="rounded-xl border border-base-750/80 bg-base-850/60 p-3.5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-bold text-slate-100 truncate flex items-center gap-1.5">
                      <Building2 size={13} className="text-cyber-cyan shrink-0" />
                      <span>{h.hospital_name}</span>
                    </p>
                  </div>
                  <SeverityBadge label={h.surge_risk_level} withDot={false} className="text-[10px]" />
                </div>

                {/* 4 Surge Metric Tiles */}
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <Stat label="Cases" value={h.expected_heat_stroke_cases.toFixed(0)} />
                  <Stat label="Admissions" value={h.expected_admissions.toFixed(0)} />
                  <Stat label="ICU Needs" value={h.expected_icu_requirement.toFixed(0)} />
                  <Stat label="OPD Load" value={h.expected_opd_demand.toFixed(0)} />
                </div>

                {/* Capacity Utilization Progress */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Projected Occupancy</span>
                    <span className="data-num font-bold text-white">
                      {h.capacity_utilization_pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-base-800">
                    <div
                      className="h-full rounded-full bg-ember-gradient transition-all duration-500"
                      style={{ width: `${Math.min(h.capacity_utilization_pct, 100)}%` }}
                    />
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-base-900/80 rounded-md py-1.5 px-1 border border-base-750">
      <p className="data-num text-sm font-bold text-white leading-none">{value}</p>
      <p className="text-[9px] font-mono text-slate-400 mt-1 truncate">{label}</p>
    </div>
  );
}
