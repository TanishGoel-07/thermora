import { useState } from "react";
import { HeartPulse, Droplets, ShieldAlert, Thermometer, AlertTriangle, Activity, User, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import { Panel, SectionHeading } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/ui/badge";
import { api, type CitizenRiskResult } from "@/api/client";
import { useGeneralTips } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";

export default function HealthGuidancePage() {
  const { data: tips } = useGeneralTips();
  const { selectedWardId, selectedWard } = useWardContext();

  const [age, setAge] = useState(38);
  const [gender, setGender] = useState("prefer_not_to_say");
  const [occupation, setOccupation] = useState("");
  const [exposureHours, setExposureHours] = useState(2);
  const [outdoorWorker, setOutdoorWorker] = useState(false);
  const [hasChronicCondition, setHasChronicCondition] = useState(false);
  const [result, setResult] = useState<CitizenRiskResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCompute() {
    setLoading(true);
    try {
      const res = await api.citizenRiskAssessment({
        ward_id: selectedWardId,
        age,
        gender,
        occupation: outdoorWorker ? occupation || "outdoor worker" : occupation,
        has_chronic_condition: hasChronicCondition,
        daily_outdoor_exposure_hours: exposureHours,
      });
      setResult({
        ...res,
        recommended_actions: Array.isArray(res.recommended_actions) ? res.recommended_actions : [],
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen command-grid">
      <Topbar
        title="Citizen Heat Safety & Medical Guidance"
        description="Personalized thermal vulnerability assessment, hydration guidelines, and symptom identification"
      />

      <div className="flex-1 p-4 lg:p-6 space-y-6 max-w-[1680px] mx-auto w-full">
        {/* Top Split: Risk Calculator & Medical Symptoms Comparison */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left: Citizen Heat Risk Engine (7 cols) */}
          <div className="xl:col-span-7">
            <Panel
              eyebrow="Personalized Medical Engine"
              title="Citizen Heat Risk Assessment"
              subtitle={`Calculated using ${selectedWard?.name ?? "Current Ward"} live micro-climate parameters`}
              icon={<HeartPulse className="w-4 h-4 text-ember-400" />}
              ticks
            >
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="stat-label block mb-1.5">Age (Years)</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full bg-base-850 border border-base-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-ember-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="stat-label block mb-1.5">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-base-850 border border-base-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-ember-500 font-mono"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="stat-label block mb-1.5">Occupation / Activity</label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="e.g. delivery executive, traffic police, office worker..."
                    className="w-full bg-base-850 border border-base-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-ember-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="stat-label">Daily Direct Outdoor Sun Exposure</label>
                    <span className="data-num text-sm font-bold text-ember-400 font-mono">
                      {exposureHours} Hours / Day
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={12}
                    step={1}
                    value={exposureHours}
                    onChange={(e) => setExposureHours(Number(e.target.value))}
                    className="w-full accent-ember-500 bg-base-800"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-1">
                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={outdoorWorker}
                      onChange={(e) => setOutdoorWorker(e.target.checked)}
                      className="rounded border-base-700 bg-base-850 text-ember-500 focus:ring-ember-500"
                    />
                    <span>Works primarily outdoors</span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasChronicCondition}
                      onChange={(e) => setHasChronicCondition(e.target.checked)}
                      className="rounded border-base-700 bg-base-850 text-ember-500 focus:ring-ember-500"
                    />
                    <span>Has chronic illness (cardiovascular, diabetes, asthma)</span>
                  </label>
                </div>

                <Button onClick={handleCompute} disabled={loading} className="w-full py-2.5 mt-2">
                  {loading ? "Evaluating Biometeorological Risk..." : "Calculate Personalized Heat Risk"}
                </Button>

                {/* Calculation Result */}
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-5 border-t border-base-750/80 space-y-4"
                  >
                    <div className="p-4 rounded-xl bg-base-950/80 border border-base-700 flex items-center justify-between">
                      <div>
                        <span className="mono-label text-slate-400 text-[10px]">
                          Personalized Risk Level
                        </span>
                        <div className="flex items-center gap-2.5 mt-1">
                          <SeverityBadge label={result.risk_category} />
                          <span className="text-xs text-slate-400 font-mono">
                            Heat Index: {result.heat_index_c.toFixed(1)}°C
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="data-num text-3xl font-bold text-white">
                          {result.personalized_risk_score.toFixed(0)}
                        </span>
                        <span className="mono-label block text-[9px] text-slate-500">
                          / 100 Index
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="stat-label block mb-2 text-slate-300">
                        Prescribed Actions:
                      </span>
                      <ul className="space-y-2">
                        {result.recommended_actions.map((act, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed p-2 rounded-lg bg-base-850/60 border border-base-750"
                          >
                            <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/40 text-xs text-slate-300">
                      <span className="font-bold text-red-400 font-mono block mb-1">
                        Emergency Protocol:
                      </span>
                      <p className="leading-relaxed">{result.emergency_guidance}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </Panel>
          </div>

          {/* Right: Heat Exhaustion vs Heat Stroke & Medical Triage (5 cols) */}
          <div className="xl:col-span-5 space-y-6">
            {/* Heat Exhaustion vs Heat Stroke Clinical Comparison */}
            <Panel
              eyebrow="Clinical Triage"
              title="Heat Exhaustion vs Heat Stroke"
              subtitle="Critical distinction in emergency diagnosis"
              icon={<ShieldAlert className="w-4 h-4 text-red-400" />}
              ticks
            >
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* Heat Exhaustion Column */}
                  <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono text-[10px] font-bold">
                      HEAT EXHAUSTION
                    </span>
                    <ul className="text-xs text-slate-300 space-y-1.5 leading-tight pt-1 font-mono">
                      <li>• Heavy sweating, cool pale skin</li>
                      <li>• Muscle cramping & weakness</li>
                      <li>• Dizziness & lightheadedness</li>
                      <li>• Nausea or vomiting</li>
                      <li>• Fast, weak pulse</li>
                    </ul>
                    <p className="text-[10px] text-amber-300 pt-2 border-t border-amber-500/20">
                      Move to AC area, loosen clothes, sip cool ORS water.
                    </p>
                  </div>

                  {/* Heat Stroke Column */}
                  <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/40 space-y-2">
                    <span className="px-2 py-0.5 rounded bg-red-500/30 text-red-300 font-mono text-[10px] font-bold animate-pulse">
                      HEAT STROKE (LETHAL)
                    </span>
                    <ul className="text-xs text-slate-200 space-y-1.5 leading-tight pt-1 font-mono">
                      <li>• Body temp &gt; 104°F (40°C)</li>
                      <li>• Hot, red, dry skin (no sweat)</li>
                      <li>• Confusion or loss of consciousness</li>
                      <li>• Throbbing headache</li>
                      <li>• Rapid, strong bounding pulse</li>
                    </ul>
                    <p className="text-[10px] text-red-300 font-bold pt-2 border-t border-red-500/30">
                      Call 112/108 immediately. Cool victim aggressively with ice packs.
                    </p>
                  </div>
                </div>

                {/* Hydration & ORS Instructions */}
                <div className="p-4 rounded-xl bg-base-950/80 border border-base-750 space-y-2">
                  <div className="flex items-center gap-2 text-cyber-cyan font-bold text-xs">
                    <Droplets size={14} />
                    <span>Hydration & Electrolyte (ORS) Guidance</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Drink 250ml water every 20 minutes when active in heat. Supplement with Oral
                    Rehydration Salts (ORS), coconut water, or lemon water with salt. Avoid caffeine
                    and high-sugar sodas which accelerate dehydration.
                  </p>
                </div>
              </div>
            </Panel>

            {/* General Tips */}
            <Panel
              eyebrow="Preventative Safety"
              title="Official Heat Safety Directives"
              ticks
            >
              <ul className="p-5 space-y-3">
                {(Array.isArray(tips?.tips) ? tips.tips : []).map((tip, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-ember-400 mt-2 shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
