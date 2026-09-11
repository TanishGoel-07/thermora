import { useState } from "react";
import { AlertTriangle, Check, BellRing, Filter, Clock, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import { Panel } from "@/components/ui/panel";
import { SeverityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAlerts } from "@/hooks/useThermoraData";
import { api } from "@/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function AlertsPage() {
  const [filter, setFilter] = useState<"all" | "active" | "dismissed">("all");
  const { data: rawAlerts, isLoading } = useAlerts(false);
  const alerts = Array.isArray(rawAlerts) ? rawAlerts : [];
  const qc = useQueryClient();

  async function handleDismiss(id: number) {
    await api.dismissAlert(id);
    qc.invalidateQueries({ queryKey: ["alerts"] });
    qc.invalidateQueries({ queryKey: ["active-alert"] });
  }

  const filteredAlerts = alerts.filter((a) => {
    if (filter === "active") return a.is_active;
    if (filter === "dismissed") return !a.is_active;
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen command-grid">
      <Topbar
        title="Alerts Command Center"
        description="Active and historical heatwave advisories, municipal emergency directives, and alert logs"
      />

      <div className="flex-1 p-4 lg:p-6 space-y-6 max-w-[1400px] mx-auto w-full">
        <Panel
          eyebrow="Broadcast Log"
          title="Heat Advisory Bulletins"
          subtitle="All automated notifications generated across district wards"
          icon={<BellRing className="w-4 h-4" />}
          ticks
          action={
            <div className="flex items-center gap-1.5 bg-base-950/80 p-1 rounded-lg border border-base-750 text-xs">
              {(["all", "active", "dismissed"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilter(mode)}
                  className={cn(
                    "px-3 py-1 rounded-md font-mono text-[11px] capitalize transition-all",
                    filter === mode
                      ? "bg-base-800 text-ember-400 font-bold shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          }
        >
          <div className="p-4">
            {isLoading ? (
              <div className="space-y-3 p-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse bg-base-800/50 rounded-xl" />
                ))}
              </div>
            ) : !filteredAlerts || filteredAlerts.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-slate-200">
                  No {filter !== "all" ? filter : ""} alerts in log
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  All monitoring thresholds remain in nominal state.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-base-750/60">
                <AnimatePresence>
                  {filteredAlerts.map((a, i) => (
                    <motion.li
                      key={a.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      className="flex flex-col sm:flex-row items-start gap-4 py-4 px-2 hover:bg-base-850/40 rounded-xl transition-colors"
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                          a.is_active
                            ? "bg-red-950/60 text-red-400 border-red-500/40 shadow-glow-danger"
                            : "bg-base-850 text-slate-400 border-base-700"
                        )}
                      >
                        <AlertTriangle size={18} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="text-sm sm:text-base font-bold text-slate-100">
                            {a.title}
                          </h4>
                          <SeverityBadge label={a.level.replace("_", " ")} />
                          {!a.is_active && (
                            <span className="mono-label px-2 py-0.5 rounded bg-base-800 text-slate-500 border border-base-700 text-[9px]">
                              Dismissed
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                          {a.message}
                        </p>

                        {a.recommended_action && (
                          <div className="mt-2 p-2.5 rounded-lg bg-base-950/60 border border-base-750 text-xs text-slate-300">
                            <span className="text-ember-400 font-bold font-mono">Directive: </span>
                            {a.recommended_action}
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-2.5 text-[11px] font-mono text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(a.created_at).toLocaleString()}
                          </span>
                          <span>·</span>
                          <span>Ward #{a.ward_id}</span>
                          <span>·</span>
                          <span>HTSI: <strong className="text-slate-300">{a.htsi_score.toFixed(0)}</strong></span>
                        </div>
                      </div>

                      {a.is_active && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDismiss(a.id)}
                          className="shrink-0 self-end sm:self-center"
                        >
                          <Check size={14} />
                          <span>Acknowledge</span>
                        </Button>
                      )}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
