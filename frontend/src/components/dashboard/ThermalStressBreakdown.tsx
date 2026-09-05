import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useWardBreakdown } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";
import { Panel } from "@/components/ui/panel";

const COLORS = ["#F59B3C", "#5EEAD4", "#818CF8", "#F2994A", "#EB5757"];

export function ThermalStressBreakdown() {
  const { selectedWardId } = useWardContext();
  const { data, isLoading } = useWardBreakdown(selectedWardId);

  const chartData = data?.map((d) => ({ name: d.factor, value: d.contribution_pct }));

  return (
    <Panel
      title="Thermal Stress Breakdown"
      subtitle="Contribution of each driver to current HTSI"
      className="h-full"
    >
      <div className="p-5 h-[260px]">
        {isLoading || !chartData ? (
          <div className="w-full h-full animate-pulse bg-base-800/50 rounded-lg" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24 }}>
              <XAxis type="number" hide domain={[0, "dataMax + 10"]} />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fill: "#94A3B8", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                contentStyle={{
                  background: "#121924",
                  border: "1px solid #1A2330",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: number) => [`${v.toFixed(1)}%`, "Contribution"]}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Panel>
  );
}
