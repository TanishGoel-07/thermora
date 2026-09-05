import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useActiveAlert } from "@/hooks/useThermoraData";
import { SeverityBadge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";

export function AlertPanel() {
  const { data: alert, isLoading } = useActiveAlert();

  return (
    <Panel title="Active Alert" className="h-full">
      <div className="p-5">
        {isLoading ? (
          <div className="h-32 animate-pulse bg-base-800/50 rounded-lg" />
        ) : alert ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-risk-danger/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-risk-danger" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <SeverityBadge label={alert.level.replace("_", " ")} />
                </div>
                <h4 className="text-sm font-semibold text-slate-100">{alert.title}</h4>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">{alert.message}</p>

            <div className="pt-3 border-t border-base-700/50">
              <span className="stat-label block mb-1.5">Recommended Action</span>
              <p className="text-sm text-slate-300 leading-relaxed">{alert.recommended_action}</p>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
              <span>Risk Level</span>
              <span className="data-num font-medium text-slate-300">
                {alert.htsi_score.toFixed(0)} / 100
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-10 h-10 rounded-full bg-risk-safe/10 flex items-center justify-center mb-3">
              <ShieldCheck size={20} className="text-risk-safe" />
            </div>
            <p className="text-sm font-medium text-slate-200">No active alerts</p>
            <p className="text-xs text-slate-500 mt-1">Conditions are within safe thresholds.</p>
          </div>
        )}
      </div>
    </Panel>
  );
}
