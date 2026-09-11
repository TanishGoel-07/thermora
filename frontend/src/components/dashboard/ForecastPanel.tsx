import { CloudSun, Calendar, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { useFiveDayForecast } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";
import { SeverityBadge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { riskColor } from "@/lib/utils";

export function ForecastPanel() {
  const { selectedWardId } = useWardContext();
  const { data: rawData, isLoading } = useFiveDayForecast(selectedWardId);
  const data = Array.isArray(rawData) ? rawData : [];

  return (
    <Panel
      eyebrow="Outlook Feed"
      title="5-Day Forecast Stream"
      subtitle="Probability index per day"
      icon={<CloudSun className="w-4 h-4" />}
      ticks
      className="h-full"
    >
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse bg-base-800/50 rounded-lg" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 font-mono">
            No forecast data available for this ward.
          </div>
        ) : (
          <ul className="space-y-2">
            {data.map((d, i) => {
              const color = riskColor(d.severity);
              return (
                <motion.li
                  key={d.date}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-base-850/60 border border-base-750/70 hover:border-base-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-base-800 flex items-center justify-center font-display font-bold text-xs text-white">
                      {d.day_label}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        {new Date(d.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500">
                        Span: {d.estimated_duration_days.toFixed(1)} days
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <SeverityBadge label={d.severity} withDot={false} className="text-[10px] px-2 py-0.5" />
                    <div>
                      <p className="data-num text-base font-bold" style={{ color }}>
                        {d.risk_pct.toFixed(0)}%
                      </p>
                      <span className="mono-label text-[8px] text-slate-500 block">Risk</span>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </Panel>
  );
}
