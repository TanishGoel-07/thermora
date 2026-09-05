import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/ui/badge";
import { api, type ThermalStressResult } from "@/api/client";
import { useGeneralTips } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";
import { useWardThermalLatest } from "@/hooks/useThermoraData";

export default function HealthGuidancePage() {
  const { data: tips } = useGeneralTips();
  const { selectedWardId } = useWardContext();
  const { data: latest } = useWardThermalLatest(selectedWardId);

  const [age, setAge] = useState(35);
  const [outdoorWorker, setOutdoorWorker] = useState(false);
  const [hasChronicCondition, setHasChronicCondition] = useState(false);
  const [result, setResult] = useState<ThermalStressResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCompute() {
    setLoading(true);
    try {
      const res = await api.personalizedGuidance({
        temperature_c: latest?.heat_index_c ?? 38,
        humidity_pct: 55,
        wind_speed_ms: 1.5,
        solar_radiation_wm2: 550,
        age,
        outdoor_worker: outdoorWorker,
        has_chronic_condition: hasChronicCondition,
      });
      setResult(res);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Health Guidance" description="Personalized heat-safety recommendations" />
      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel title="Personalized Risk Calculator" subtitle="Based on current ward conditions">
            <div className="p-5 space-y-4">
              <div>
                <label className="stat-label block mb-1.5">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full bg-base-800 border border-base-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-ember-500"
                />
              </div>
              <label className="flex items-center gap-2.5 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={outdoorWorker}
                  onChange={(e) => setOutdoorWorker(e.target.checked)}
                  className="rounded border-base-600 bg-base-800"
                />
                Works outdoors
              </label>
              <label className="flex items-center gap-2.5 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={hasChronicCondition}
                  onChange={(e) => setHasChronicCondition(e.target.checked)}
                  className="rounded border-base-600 bg-base-800"
                />
                Has a chronic health condition
              </label>
              <Button onClick={handleCompute} disabled={loading}>
                {loading ? "Calculating..." : "Get My Risk Assessment"}
              </Button>

              {result && (
                <div className="pt-4 border-t border-base-700/50 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="data-num text-2xl font-semibold text-slate-100">
                      {result.htsi_score.toFixed(0)}
                    </span>
                    <SeverityBadge label={result.htsi_category} />
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{result.recommendation}</p>
                </div>
              )}
            </div>
          </Panel>

          <Panel title="General Heat Safety Tips">
            <ul className="p-5 space-y-3">
              {tips?.tips.map((tip, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-300 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-ember-400 mt-2 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
