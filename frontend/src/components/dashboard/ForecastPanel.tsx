import { useFiveDayForecast } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";
import { SeverityBadge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";

export function ForecastPanel() {
  const { selectedWardId } = useWardContext();
  const { data, isLoading } = useFiveDayForecast(selectedWardId);

  return (
    <Panel title="5 Day Forecast" subtitle="Ensemble heatwave probability" className="h-full">
      <div className="p-2">
        {isLoading || !data ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse bg-base-800/50 rounded-lg" />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-base-700/40">
            {data.map((d) => (
              <li key={d.date} className="flex items-center justify-between px-3 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-100">{d.day_label}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="data-num text-sm font-semibold text-slate-100">
                    {d.risk_pct.toFixed(0)}%
                  </p>
                  <div className="mt-1">
                    <SeverityBadge label={d.severity} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
