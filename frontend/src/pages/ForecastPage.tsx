import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { motion } from "framer-motion";
import { CloudSun, BrainCircuit, Sparkles, Activity } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { ForecastPanel } from "@/components/dashboard/ForecastPanel";
import { ExplainabilityPanel } from "@/components/dashboard/ExplainabilityPanel";
import { ConfusionMatrix } from "@/components/intelligence/ConfusionMatrix";
import { useFiveDayForecast, useLatestEnsemblePrediction } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";
import { Panel, SectionHeading } from "@/components/ui/panel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function ForecastPage() {
  const { selectedWardId, selectedWard } = useWardContext();
  const { data: forecast, isLoading } = useFiveDayForecast(selectedWardId);
  const { data: latestEnsemble } = useLatestEnsemblePrediction(selectedWardId);

  const chartData = Array.isArray(forecast)
    ? forecast.map((d) => ({
        day: d.day_label,
        fullDate: new Date(d.date).toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        risk: d.risk_pct,
        duration: d.estimated_duration_days,
        probability: Math.round(d.heatwave_probability * 100),
      }))
    : [];

  return (
    <div className="flex flex-col min-h-screen command-grid">
      <Topbar
        title="AI Forecast & Model Evaluation"
        description="5-day multi-model heatwave forecast, ensemble probability, and confusion matrix validation"
      />

      <div className="flex-1 p-4 lg:p-6 space-y-6 max-w-[1680px] mx-auto w-full">
        {/* Top Forecast Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <Panel
              eyebrow="Predictive Trajectory"
              title={`5-Day Heatwave Probability Trend — ${selectedWard?.name ?? "Selected Ward"}`}
              subtitle="Ensemble risk progression with duration estimate"
              icon={<CloudSun className="w-4 h-4" />}
              ticks
            >
              <div className="p-5 h-[340px]">
                {isLoading || chartData.length === 0 ? (
                  <div className="w-full h-full animate-pulse bg-base-850/80 rounded-xl" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="forecastColorArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59B3C" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#E4572E" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#182232" vertical={false} />
                      <XAxis
                        dataKey="day"
                        tick={{ fill: "#94A3B8", fontSize: 12, fontFamily: "IBM Plex Mono" }}
                        axisLine={{ stroke: "#1E2A3E" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#94A3B8", fontSize: 12, fontFamily: "IBM Plex Mono" }}
                        axisLine={{ stroke: "#1E2A3E" }}
                        tickLine={false}
                        domain={[0, 100]}
                        unit="%"
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-xl border border-base-700 bg-base-950/95 p-3 shadow-panel backdrop-blur-md text-xs font-mono">
                                <p className="font-bold text-white mb-1.5">{data.fullDate}</p>
                                <div className="space-y-1">
                                  <p className="text-ember-400">
                                    Heatwave Risk: <strong className="text-white">{data.risk}%</strong>
                                  </p>
                                  <p className="text-slate-400">
                                    Duration Span: <strong className="text-white">{data.duration.toFixed(1)} days</strong>
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="risk"
                        stroke="#F59B3C"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#forecastColorArea)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Panel>
          </div>

          <div className="xl:col-span-1">
            <ForecastPanel />
          </div>
        </div>

        {/* Section 02: Model Transparency, Confusion Matrix, and Explainability */}
        <section className="space-y-4">
          <SectionHeading
            index="02"
            label="Machine Learning Validation & Transparency"
            hint="Ensemble Performance · Ground Truth Confusion Matrix"
          />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* The brand new §6.1 Confusion Matrix */}
            <ConfusionMatrix wardId={selectedWardId} />

            {/* Explainability SHAP Drivers */}
            <ExplainabilityPanel />
          </div>
        </section>
      </div>
    </div>
  );
}
