import { useWardBreakdown } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";
import { Panel } from "@/components/ui/panel";
import { Info } from "lucide-react";

export function RiskDriversPanel() {
  const { selectedWardId, selectedWard } = useWardContext();
  const { data, isLoading } = useWardBreakdown(selectedWardId);

  const topDriver = data?.[0];

  return (
    <Panel title="Risk Drivers" subtitle="Why risk is high right now" className="h-full">
      <div className="p-5 space-y-3">
        {isLoading || !data ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse bg-base-800/50 rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            {topDriver && (
              <div className="flex gap-3 p-3 rounded-lg bg-ember-500/10 border border-ember-500/20">
                <Info size={16} className="text-ember-400 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-200">
                  <span className="font-medium">{topDriver.factor}</span> is the leading factor
                  in {selectedWard?.name ?? "this ward"}, contributing{" "}
                  {topDriver.contribution_pct.toFixed(0)}% of the current risk score.
                </p>
              </div>
            )}
            <ul className="space-y-2.5">
              {data.map((d) => (
                <li key={d.factor} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{d.factor}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{d.explanation}</p>
                  </div>
                  <span className="data-num text-sm text-slate-400 shrink-0">
                    {d.contribution_pct.toFixed(0)}%
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Panel>
  );
}
