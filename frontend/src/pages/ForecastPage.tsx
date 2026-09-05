import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Topbar } from "@/components/layout/Topbar";
import { ForecastPanel } from "@/components/dashboard/ForecastPanel";
import { useFiveDayForecast } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";
import { Panel } from "@/components/ui/panel";

export default function ForecastPage() {
  const { selectedWardId } = useWardContext();
  const { data } = useFiveDayForecast(selectedWardId);

  const chartData = data?.map((d) => ({
    day: d.day_label,
    risk: d.risk_pct,
    duration: d.estimated_duration_days,
  }));

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Forecast" description="5-day ensemble heatwave probability and severity outlook" />
      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <Panel title="Heatwave Risk Trend" subtitle="Ensemble probability over the next 5 days">
              <div className="p-5 h-[320px]">
                {chartData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1A2330" />
                      <XAxis dataKey="day" tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fill: "#94A3B8", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 100]}
                        unit="%"
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#121924",
                          border: "1px solid #1A2330",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="risk"
                        stroke="#F59B3C"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "#F59B3C" }}
                        name="Risk %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full animate-pulse bg-base-800/50 rounded-lg" />
                )}
              </div>
            </Panel>
          </div>
          <div className="xl:col-span-1">
            <ForecastPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
