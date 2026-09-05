import { useQuery } from "@tanstack/react-query";
import { Topbar } from "@/components/layout/Topbar";
import { Panel } from "@/components/ui/panel";
import { api } from "@/api/client";

export default function SettingsPage() {
  const { data: thresholds } = useQuery({ queryKey: ["thresholds"], queryFn: api.thresholds });
  const { data: sysInfo } = useQuery({ queryKey: ["system-info"], queryFn: api.systemInfo });

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Settings" description="Risk thresholds and system configuration" />
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="HTSI Risk Thresholds">
          <div className="p-5 space-y-4">
            {thresholds ? (
              <>
                <ThresholdRow label="Safe (max)" value={thresholds.htsi_safe_max} color="#3ADB8A" />
                <ThresholdRow label="Caution (max)" value={thresholds.htsi_caution_max} color="#F2C94C" />
                <ThresholdRow label="Danger (max)" value={thresholds.htsi_danger_max} color="#F2994A" />
                <ThresholdRow
                  label="Alert trigger threshold"
                  value={thresholds.alert_risk_threshold}
                  color="#EB5757"
                />
              </>
            ) : (
              <div className="h-32 animate-pulse bg-base-800/50 rounded-lg" />
            )}
          </div>
        </Panel>

        <Panel title="System Information">
          <div className="p-5 space-y-3 text-sm">
            {sysInfo ? (
              Object.entries(sysInfo).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-base-700/40 pb-2">
                  <span className="text-slate-500 capitalize">{k.replace(/_/g, " ")}</span>
                  <span className="text-slate-300 data-num text-right">
                    {typeof v === "object" ? JSON.stringify(v) : String(v)}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-32 animate-pulse bg-base-800/50 rounded-lg" />
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ThresholdRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="data-num text-sm text-slate-100">{value.toFixed(0)}</span>
      </div>
      <div className="h-1.5 bg-base-700/60 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
