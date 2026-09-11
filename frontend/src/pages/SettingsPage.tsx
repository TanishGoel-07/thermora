import { useQuery } from "@tanstack/react-query";
import { Sliders, Server, ShieldCheck, Database, HardDrive, Cpu, Terminal } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Panel } from "@/components/ui/panel";
import { api } from "@/api/client";

export default function SettingsPage() {
  const { data: thresholds, isLoading: thresholdsLoading } = useQuery({
    queryKey: ["thresholds"],
    queryFn: api.thresholds,
  });
  const { data: sysInfo, isLoading: sysInfoLoading } = useQuery({
    queryKey: ["system-info"],
    queryFn: api.systemInfo,
  });

  return (
    <div className="flex flex-col min-h-screen command-grid">
      <Topbar
        title="System Settings & Telemetry Configuration"
        description="Biometeorological risk thresholds, data pipelines, and platform infrastructure diagnostics"
      />

      <div className="flex-1 p-4 lg:p-6 space-y-6 max-w-[1680px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* HTSI Risk Threshold Configuration */}
          <Panel
            eyebrow="Algorithmic Boundaries"
            title="HTSI Risk Category Thresholds"
            subtitle="Trigger thresholds for alert engine escalation and color bands"
            icon={<Sliders className="w-4 h-4" />}
            ticks
          >
            <div className="p-5 space-y-5">
              {thresholdsLoading || !thresholds ? (
                <div className="h-44 animate-pulse bg-base-800/50 rounded-xl" />
              ) : (
                <>
                  <ThresholdRow
                    label="Safe Condition (Upper Ceiling)"
                    value={thresholds.htsi_safe_max}
                    color="#10B981"
                    description="HTSI scores below this are considered physiologically nominal."
                  />
                  <ThresholdRow
                    label="Caution Condition (Upper Ceiling)"
                    value={thresholds.htsi_caution_max}
                    color="#F59E0B"
                    description="Elevated stress; outdoor worker advisory warnings generated."
                  />
                  <ThresholdRow
                    label="Danger Condition (Upper Ceiling)"
                    value={thresholds.htsi_danger_max}
                    color="#F97316"
                    description="High risk of thermal injury; cooling shelters activated."
                  />
                  <ThresholdRow
                    label="Automated Broadcast Alert Trigger"
                    value={thresholds.alert_risk_threshold}
                    color="#DC2626"
                    description="Immediate SMS/WhatsApp/Push emergency broadcast dispatched."
                  />
                </>
              )}
            </div>
          </Panel>

          {/* System Information & Ingestion Pipelines */}
          <Panel
            eyebrow="Infrastructure Telemetry"
            title="Platform Diagnostics & Environment"
            subtitle="Backend runtime, model ensemble version, and database sync status"
            icon={<Server className="w-4 h-4" />}
            ticks
          >
            <div className="p-5 space-y-3">
              {sysInfoLoading || !sysInfo ? (
                <div className="h-44 animate-pulse bg-base-800/50 rounded-xl" />
              ) : (
                <div className="divide-y divide-base-750/60 font-mono text-xs">
                  {Object.entries(sysInfo).map(([k, v]) => (
                    <div
                      key={k}
                      className="py-2.5 flex items-center justify-between gap-4"
                    >
                      <span className="text-slate-400 capitalize">
                        {k.replace(/_/g, " ")}
                      </span>
                      <span className="data-num text-slate-200 text-right font-semibold">
                        {typeof v === "object" ? JSON.stringify(v) : String(v)}
                      </span>
                    </div>
                  ))}

                  {/* Supplemental runtime specs */}
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-400">ML Ensemble Status</span>
                    <span className="text-emerald-400 font-bold">XGB + RF + LSTM Online</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-400">PostGIS Boundary Layer</span>
                    <span className="text-cyber-cyan font-bold">Indexed (SRID 4326)</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-400">Satellite Data Pipeline</span>
                    <span className="text-amber-400 font-bold">Landsat-8 / NASA POWER Active</span>
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function ThresholdRow({
  label,
  value,
  color,
  description,
}: {
  label: string;
  value: number;
  color: string;
  description: string;
}) {
  return (
    <div className="space-y-1.5 p-3 rounded-xl bg-base-850/60 border border-base-750/70">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-200">{label}</span>
        <span
          className="data-num text-sm font-bold px-2 py-0.5 rounded bg-base-900 border border-base-750"
          style={{ color }}
        >
          {value.toFixed(0)} Index
        </span>
      </div>
      <div className="h-2 bg-base-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-[10px] text-slate-400 leading-tight">{description}</p>
    </div>
  );
}
