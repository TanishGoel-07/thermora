import { useHeatwaveExplanation } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";
import { Panel } from "@/components/ui/panel";
import { SeverityBadge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function ExplainabilityPanel() {
  const { selectedWardId } = useWardContext();
  const { data: rawData, isLoading } = useHeatwaveExplanation(selectedWardId);
  const data =
    rawData && Array.isArray(rawData.contributors)
      ? rawData
      : rawData
      ? { ...rawData, contributors: [] }
      : undefined;

  return (
    <Panel
      eyebrow="Model Transparency"
      title="Explainable Heatwave Drivers"
      subtitle="Signed feature SHAP contributions towards ensemble prediction"
      icon={<Sparkles className="w-4 h-4" />}
      ticks
      className="h-full"
    >
      <div className="p-5 space-y-4">
        {isLoading || !data ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse bg-base-800/50 rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-base-950/80 border border-base-750">
              <div className="data-num text-3xl font-extrabold text-white">
                {data.heatwave_probability.toFixed(0)}%
              </div>
              <div>
                <p className="mono-label text-slate-400 text-[10px]">Model Heatwave Probability</p>
                <div className="mt-0.5">
                  <SeverityBadge label={data.severity_level} />
                </div>
              </div>
            </div>

            <ul className="space-y-3 pt-1">
              {data.contributors.map((c, i) => {
                const positive = c.direction_pct >= 0;
                return (
                  <motion.li
                    key={c.factor}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                    className="p-3 rounded-lg bg-base-850/60 border border-base-750/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {positive ? (
                          <span className="p-1 rounded bg-red-950/60 text-red-400 border border-red-500/30">
                            <TrendingUp size={13} />
                          </span>
                        ) : (
                          <span className="p-1 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                            <TrendingDown size={13} />
                          </span>
                        )}
                        <span className="text-xs sm:text-sm font-bold text-slate-200">
                          {c.factor}
                        </span>
                      </div>

                      <span
                        className={`data-num text-sm font-bold ${
                          positive ? "text-red-400" : "text-emerald-400"
                        }`}
                      >
                        {positive ? "+" : ""}
                        {c.direction_pct.toFixed(0)}%
                      </span>
                    </div>

                    <div className="h-1.5 bg-base-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          positive ? "bg-red-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(Math.abs(c.direction_pct), 100)}%` }}
                      />
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{c.explanation}</p>
                  </motion.li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </Panel>
  );
}
