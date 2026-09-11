import { CloudSun, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Panel } from "@/components/ui/panel";
import { useFiveDayForecast } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";
import { SeverityBadge } from "@/components/ui/badge";
import { riskColor } from "@/lib/utils";

export function ForecastStrip() {
  const { selectedWardId } = useWardContext();
  const { data: forecast, isLoading } = useFiveDayForecast(selectedWardId);

  if (isLoading || !forecast || forecast.length === 0) {
    return (
      <Panel
        eyebrow="Predictive Ensemble"
        title="5-Day Heatwave Horizon"
        subtitle="Ensemble risk probability timeline"
        icon={<CloudSun className="w-4 h-4" />}
        ticks
      >
        <div className="h-40 animate-pulse bg-base-800/50 rounded-lg m-5" />
      </Panel>
    );
  }

  const w = 600;
  const h = 110;
  const padX = 24;
  const padY = 16;
  const max = 100;
  const step = (w - padX * 2) / Math.max(forecast.length - 1, 1);

  const points = forecast.map((d, i) => {
    const x = padX + i * step;
    const y = padY + (1 - Math.min(100, Math.max(0, d.risk_pct)) / max) * (h - padY * 2);
    return [x, y] as const;
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1][0]},${h} L${points[0][0]},${h} Z`;

  return (
    <Panel
      eyebrow="Predictive Ensemble"
      title="5-Day Heatwave Horizon"
      subtitle="XGBoost · Random Forest · LSTM multi-model consensus"
      icon={<CloudSun className="w-4 h-4" />}
      ticks
      className="h-full"
    >
      <div className="p-5 space-y-4">
        {/* Animated Trend Graph */}
        <div className="relative overflow-hidden rounded-xl bg-base-950/80 border border-base-750/70 p-2">
          <svg
            viewBox={`0 0 ${w} ${h}`}
            className="w-full h-28"
            preserveAspectRatio="none"
            role="img"
            aria-label="5-Day Heatwave Forecast Trend"
          >
            <defs>
              <linearGradient id="forecastEmberFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59B3C" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#E4572E" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#E4572E" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#forecastEmberFill)" />
            <path
              d={linePath}
              fill="none"
              stroke="#F59B3C"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((p, i) => {
              const color = riskColor(forecast[i].severity);
              return (
                <g key={i}>
                  <circle cx={p[0]} cy={p[1]} r="5" fill="#090D14" stroke={color} strokeWidth="2.5" />
                  <circle cx={p[0]} cy={p[1]} r="2" fill={color} />
                </g>
              );
            })}
          </svg>
        </div>

        {/* 5 Daily Forecast Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {forecast.map((d, idx) => {
            const color = riskColor(d.severity);
            return (
              <motion.div
                key={d.date}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
                className="rounded-xl border border-base-750/70 bg-base-850/60 p-3 text-center flex flex-col justify-between hover:border-base-600 transition-colors"
              >
                <div>
                  <p className="mono-label text-slate-400 font-semibold text-[11px]">{d.day_label}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {new Date(d.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <div className="my-2">
                  <p className="data-num text-2xl font-extrabold" style={{ color }}>
                    {d.risk_pct.toFixed(0)}%
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {d.estimated_duration_days.toFixed(1)}d span
                  </p>
                </div>

                <div className="flex justify-center">
                  <SeverityBadge label={d.severity} withDot={false} className="px-2 py-0 text-[10px]" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}
