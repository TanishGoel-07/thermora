import { TrendingUp, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useTopRiskWards } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";
import { riskColor } from "@/lib/utils";
import { Panel } from "@/components/ui/panel";
import { SeverityBadge } from "@/components/ui/badge";

export function TopRiskWards() {
  const { data: rawData, isLoading } = useTopRiskWards(5);
  const data = Array.isArray(rawData) ? rawData : [];
  const { selectedWardId, setSelectedWardId } = useWardContext();

  return (
    <Panel
      eyebrow="Priority Ranking"
      title="Top Risk Wards"
      subtitle="Ranked by composite thermal stress index"
      icon={<TrendingUp className="w-4 h-4" />}
      ticks
      className="h-full"
    >
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse bg-base-800/50 rounded-lg" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 font-mono">
            No ward risk data available.
          </div>
        ) : (
          <ol className="space-y-2.5">
            {data.map((w, i) => {
              const color = riskColor(w.severity);
              const isSelected = w.ward_id === selectedWardId;

              return (
                <motion.li
                  key={w.ward_id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                  onClick={() => setSelectedWardId(w.ward_id)}
                  className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                    isSelected
                      ? "bg-base-800/90 border-ember-500/80 shadow-glow/20"
                      : "bg-base-850/60 border-base-750/70 hover:border-base-600 hover:bg-base-800/70"
                  }`}
                >
                  <span
                    className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold shrink-0"
                    style={{
                      backgroundColor: `${color}25`,
                      color: color,
                    }}
                  >
                    {i + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-100 group-hover:text-ember-400 transition-colors">
                        {w.ward_name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="data-num text-sm font-bold" style={{ color }}>
                          {w.risk_score.toFixed(0)}
                        </span>
                        <SeverityBadge label={w.severity} withDot={false} className="text-[10px] px-1.5 py-0" />
                      </div>
                    </div>

                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-base-800">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(w.risk_score, 100)}%`,
                          background: color,
                        }}
                      />
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        )}
      </div>
    </Panel>
  );
}
