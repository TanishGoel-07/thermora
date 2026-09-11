import { AlertTriangle, ShieldCheck, Clock, Send, Radio } from "lucide-react";
import { useActiveAlert } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";
import { SeverityBadge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";

const CONFIGURED_CHANNELS = [
  { name: "SMS Broadcast", count: "12,450 sent" },
  { name: "Emergency Push", count: "8,920 received" },
  { name: "WhatsApp Advisory", count: "Active" },
  { name: "Municipal Sirens", count: "Standby" },
];

export function AlertPanel() {
  const { selectedWardId } = useWardContext();
  const { data: alert, isLoading } = useActiveAlert(selectedWardId);

  return (
    <Panel
      eyebrow="Live Warning Network"
      title="Active Alert Protocol"
      subtitle="Ward-scoped automated citizen notification"
      ticks
      className="h-full"
    >
      <div className="p-4 flex flex-col justify-between h-full">
        {isLoading ? (
          <div className="h-44 animate-pulse bg-base-800/50 rounded-lg" />
        ) : alert ? (
          <div className="flex flex-col gap-3.5 justify-between h-full">
            {/* Alert Header Box */}
            <div className="p-3.5 rounded-xl border border-red-500/40 bg-red-950/30">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="mono-label text-red-400 font-bold">
                    EMERGENCY DIRECTIVE
                  </span>
                </div>
                <SeverityBadge label={alert.level.replace("_", " ")} />
              </div>
              <h3 className="font-display text-base font-bold text-white mt-1.5 leading-snug">
                {alert.title}
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {alert.message}
              </p>
            </div>

            {/* Recommended Action */}
            <div className="p-3 rounded-lg border border-base-750 bg-base-950/60">
              <p className="mono-label text-slate-400 text-[10px]">Recommended Protocol</p>
              <p className="text-xs font-medium text-slate-100 mt-1 leading-relaxed">
                {alert.recommended_action}
              </p>
            </div>

            {/* Configured Dissemination Channels */}
            <div className="pt-2">
              <p className="mono-label text-slate-500 mb-2 flex items-center justify-between">
                <span>Dissemination Pipeline</span>
                <span className="text-emerald-400 font-mono">Synced</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {CONFIGURED_CHANNELS.map((c) => (
                  <div
                    key={c.name}
                    className="p-2 rounded-md bg-base-850/90 border border-base-750 flex flex-col justify-between text-[11px]"
                  >
                    <span className="text-slate-300 font-medium flex items-center gap-1">
                      <Send className="w-2.5 h-2.5 text-ember-400" />
                      {c.name}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 mt-0.5">
                      {c.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck size={24} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                No Active Alert in Effect
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
                Thermal index and heatwave metrics for this ward are currently within nominal thresholds.
              </p>
            </div>
            <span className="mono-label px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[10px]">
              Continuous Monitoring Active
            </span>
          </div>
        )}
      </div>
    </Panel>
  );
}
