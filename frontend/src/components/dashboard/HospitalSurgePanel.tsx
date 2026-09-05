import { useHospitalSurge } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";
import { Panel } from "@/components/ui/panel";
import { SeverityBadge } from "@/components/ui/badge";

export function HospitalSurgePanel() {
  const { selectedWardId } = useWardContext();
  const { data, isLoading } = useHospitalSurge(selectedWardId);

  return (
    <Panel title="Hospital Surge Prediction" subtitle="Expected heat-related case load" className="h-full">
      <div className="p-2">
        {isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse bg-base-800/50 rounded-lg" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-slate-500 p-5">No hospitals registered for this ward.</p>
        ) : (
          <ul className="divide-y divide-base-700/40">
            {data.map((h) => (
              <li key={h.hospital_id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-sm font-medium text-slate-100 truncate pr-2">{h.hospital_name}</p>
                  <SeverityBadge label={h.surge_risk_level} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Stat label="Expected Cases" value={h.expected_heat_stroke_cases.toFixed(0)} />
                  <Stat label="Admissions" value={h.expected_admissions.toFixed(0)} />
                  <Stat label="ICU Req." value={h.expected_icu_requirement.toFixed(0)} />
                </div>
                <div className="mt-2.5 h-1.5 bg-base-700/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-ember-gradient rounded-full"
                    style={{ width: `${Math.min(h.capacity_utilization_pct, 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {h.capacity_utilization_pct.toFixed(0)}% capacity utilization
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-base-800/60 rounded-lg py-2">
      <p className="data-num text-base font-semibold text-slate-100">{value}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
