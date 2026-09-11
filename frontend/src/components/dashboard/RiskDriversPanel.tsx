import { useWardBreakdown } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";
import { Panel } from "@/components/ui/panel";
import { Info, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export function RiskDriversPanel() {
  const { selectedWardId, selectedWard } = useWardContext();
  const { data: rawData, isLoading } = useWardBreakdown(selectedWardId);
  const data = Array.isArray(rawData) ? rawData : [];

  const topDriver = data[0];

  return (
    <Panel
      eyebrow="Explainability Matrix"
      title="Thermal Risk Drivers"
      subtitle="Factor causality behind current ward risk calculation"
      icon={<Info className="w-4 h-4" />}
      ticks
      className="h-full"
    >
      <div className="p-5 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse bg-base-800/50 rounded-lg" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 font-mono">
            No risk driver data available for this ward.
          </div>
        ) : (
          <>
            {topDriver && (
              <div className="flex gap-3 p-3.5 rounded-xl bg-ember-500/10 border border-ember-500/25">
                <AlertCircle size={17} className="text-ember-400 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  <span className="font-bold text-ember-400">{topDriver.factor}</span> is the
                  predominant contributing factor in {selectedWard?.name ?? "this ward"}, driving{" "}
                  <strong className="text-white data-num">{topDriver.contribution_pct.toFixed(0)}%</strong> of
                  the overall risk score.
                </p>
              </div>
            )}

            <ul className="space-y-3">
              {data.map((d, i) => (
                <motion.li
                  key={d.factor}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  className="p-3 rounded-lg bg-base-850/60 border border-base-750 flex items-start justify-between gap-3 hover:border-base-700 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-slate-200">{d.factor}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{d.explanation}</p>
                  </div>
                  <span className="data-num text-sm font-bold text-ember-400 shrink-0 px-2 py-0.5 rounded bg-base-900 border border-base-750">
                    {d.contribution_pct.toFixed(0)}%
                  </span>
                </motion.li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Panel>
  );
}
