import { AlertTriangle, Check } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Panel } from "@/components/ui/panel";
import { SeverityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAlerts } from "@/hooks/useThermoraData";
import { api } from "@/api/client";
import { useQueryClient } from "@tanstack/react-query";

export default function AlertsPage() {
  const { data: alerts, isLoading } = useAlerts(false);
  const qc = useQueryClient();

  async function handleDismiss(id: number) {
    await api.dismissAlert(id);
    qc.invalidateQueries({ queryKey: ["alerts"] });
    qc.invalidateQueries({ queryKey: ["active-alert"] });
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Alerts" description="Active and historical heat alerts across all wards" />
      <div className="flex-1 p-6">
        <Panel title="All Alerts">
          <div className="p-2">
            {isLoading ? (
              <div className="p-5 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse bg-base-800/50 rounded-lg" />
                ))}
              </div>
            ) : !alerts || alerts.length === 0 ? (
              <p className="text-sm text-slate-500 p-5">No alerts recorded yet.</p>
            ) : (
              <ul className="divide-y divide-base-700/40">
                {alerts.map((a) => (
                  <li key={a.id} className="flex items-start gap-4 px-4 py-4">
                    <div className="w-9 h-9 rounded-lg bg-risk-danger/10 flex items-center justify-center shrink-0">
                      <AlertTriangle size={16} className="text-risk-danger" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-slate-100">{a.title}</p>
                        <SeverityBadge label={a.level.replace("_", " ")} />
                        {!a.is_active && (
                          <span className="text-[11px] text-slate-500">(dismissed)</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 mt-1">{a.message}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        {new Date(a.created_at).toLocaleString()} · Ward #{a.ward_id} · HTSI{" "}
                        {a.htsi_score.toFixed(0)}
                      </p>
                    </div>
                    {a.is_active && (
                      <Button size="sm" variant="outline" onClick={() => handleDismiss(a.id)}>
                        <Check size={13} /> Dismiss
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
