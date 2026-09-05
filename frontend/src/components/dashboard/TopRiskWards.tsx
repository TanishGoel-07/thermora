import { useTopRiskWards } from "@/hooks/useThermoraData";
import { SeverityBadge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { riskColor } from "@/lib/utils";

export function TopRiskWards() {
  const { data, isLoading } = useTopRiskWards(5);

  return (
    <Panel title="Top 5 High Risk Wards" subtitle="Ranked by HTSI score" className="h-full">
      <div className="p-2">
        {isLoading || !data ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse bg-base-800/50 rounded-lg" />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-base-700/40">
            {data.map((w) => (
              <li key={w.ward_id} className="flex items-center gap-3 px-3 py-3">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold data-num shrink-0"
                  style={{
                    backgroundColor: `${riskColor(w.severity)}1A`,
                    color: riskColor(w.severity),
                  }}
                >
                  {w.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-100 truncate">{w.ward_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-base-700/60 rounded-full overflow-hidden max-w-[100px]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(w.risk_score, 100)}%`,
                          backgroundColor: riskColor(w.severity),
                        }}
                      />
                    </div>
                    <span className="text-xs data-num text-slate-400">{w.risk_score.toFixed(0)}</span>
                  </div>
                </div>
                <SeverityBadge label={w.severity} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
