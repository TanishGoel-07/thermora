import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  HeartPulse,
  Fan,
  ShieldAlert,
  Lock,
  LogOut,
  MapPin,
  TrendingUp,
  AlertOctagon,
  Compass,
} from "lucide-react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import { Panel, SectionHeading } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/ui/badge";
import { WardExplorer } from "@/components/geo/WardExplorer";
import { api, type DistrictOverview } from "@/api/client";
import { useWardContext } from "@/context/WardContext";
import { riskColor } from "@/lib/utils";

const TOKEN_STORAGE_KEY = "thermora_gov_token";

export default function GovernmentPage() {
  const { selectedDistrictId, districts } = useWardContext();
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY)
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [overview, setOverview] = useState<DistrictOverview | null>(null);
  const [loading, setLoading] = useState(false);

  const activeDistrict = districts.find((d) => d.id === selectedDistrictId);

  async function handleLogin() {
    setLoginError(null);
    try {
      const res = await api.login(email, password);
      localStorage.setItem(TOKEN_STORAGE_KEY, res.access_token);
      setToken(res.access_token);
    } catch (err) {
      setLoginError(
        "Invalid credentials or account does not possess authorized officer credentials."
      );
    }
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setOverview(null);
  }

  useEffect(() => {
    if (!token || !selectedDistrictId) return;
    setLoading(true);
    api
      .districtGovernmentOverview(selectedDistrictId, token)
      .then((res) =>
        setOverview({
          ...res,
          high_risk_areas: Array.isArray(res.high_risk_areas) ? res.high_risk_areas : [],
          emergency_recommendations: Array.isArray(res.emergency_recommendations)
            ? res.emergency_recommendations
            : [],
        })
      )
      .catch(() => {
        setOverview(null);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token, selectedDistrictId]);

  if (!token) {
    return (
      <div className="flex flex-col min-h-screen command-grid">
        <Topbar
          title="Government Situational Command"
          description="Restricted officer console for District Magistrates, Municipal Commissioners, and DMA"
        />
        <div className="flex-1 p-6 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <Panel
              eyebrow="Security Gate"
              title="Official Authorization Required"
              subtitle="Role-gated portal for District Officer, State Officer, and Admin"
              icon={<Lock className="w-4 h-4 text-ember-400" />}
              ticks
            >
              <div className="p-6 space-y-4">
                <div className="p-3 rounded-lg bg-base-950/60 border border-base-750 text-xs text-slate-400 leading-relaxed font-mono">
                  Access grants jurisdiction-level control over hospital reserve deployment,
                  cooling shelter expansion, and broadcast alert issuance.
                </div>

                <div>
                  <label className="stat-label block mb-1.5">Officer ID / Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@disastermgmt.gov.in"
                    className="w-full bg-base-850 border border-base-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-ember-500"
                  />
                </div>

                <div>
                  <label className="stat-label block mb-1.5">Secure Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-base-850 border border-base-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-ember-500"
                  />
                </div>

                {loginError && (
                  <p className="text-xs text-red-400 font-mono p-2 rounded bg-red-950/40 border border-red-500/30">
                    {loginError}
                  </p>
                )}

                <Button onClick={handleLogin} className="w-full py-2.5">
                  Authorize & Access Command
                </Button>
              </div>
            </Panel>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen command-grid">
      <Topbar
        title="Government Situational Overview"
        description="District Magistrate & Emergency Management administrative oversight"
      />

      <div className="flex-1 p-4 lg:p-6 space-y-8 max-w-[1680px] mx-auto w-full">
        {/* Officer Status Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-base-900/90 border border-base-750/80 shadow-panel">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldAlert size={16} />
            </div>
            <div>
              <span className="mono-label text-emerald-400 text-[10px]">
                Authorized Officer Session Active
              </span>
              <p className="text-xs font-mono text-slate-300">
                Jurisdiction: <strong className="text-white">{activeDistrict?.name ?? "District"}</strong> (State Level Sync)
              </p>
            </div>
          </div>

          <Button size="xs" variant="outline" onClick={handleLogout} className="font-mono text-xs">
            <LogOut size={12} />
            <span>Terminate Session</span>
          </Button>
        </div>

        {loading || !overview ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="panel h-32 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Section 01: District Level KPI Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <GovStatCard
                icon={AlertOctagon}
                label="District Severity"
                value={overview.heatwave_severity}
                badge
                color="#EF4444"
              />
              <GovStatCard
                icon={HeartPulse}
                label="Average HTSI Index"
                value={overview.average_htsi_score.toFixed(0)}
                caption="Rolling district mean"
                color="#F59B3C"
              />
              <GovStatCard
                icon={Users}
                label="Vulnerable Population"
                value={overview.vulnerable_population_estimate.toLocaleString()}
                caption="Elderly + at-risk load"
                color="#38BDF8"
              />
              <GovStatCard
                icon={Building2}
                label="High Risk Wards"
                value={String(overview.high_risk_areas.length)}
                caption="Above danger threshold"
                color="#EF4444"
              />
            </div>

            {/* Section 02: High Risk Wards & Capacity Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* High Risk Wards */}
              <Panel
                eyebrow="Critical Priority"
                title={`High Risk Wards in ${overview.district_name}`}
                subtitle="Areas currently crossing danger thresholds"
                ticks
              >
                <div className="p-3">
                  {overview.high_risk_areas.length === 0 ? (
                    <p className="text-xs text-slate-500 font-mono p-6 text-center">
                      No wards in this district currently exceed danger levels.
                    </p>
                  ) : (
                    <ul className="divide-y divide-base-750/60 max-h-[320px] overflow-y-auto">
                      {overview.high_risk_areas.map((a) => (
                        <li
                          key={a.ward_id}
                          className="flex items-center justify-between px-3 py-3 hover:bg-base-850/40 rounded-lg transition-colors"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-100">{a.ward_name}</p>
                            <p className="text-xs font-mono text-slate-500 mt-0.5">
                              Pop: {a.population.toLocaleString()} ·{" "}
                              {(a.elderly_population_pct * 100).toFixed(0)}% elderly
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="data-num text-base font-bold text-red-400">
                              {a.htsi_score.toFixed(0)} HTSI
                            </span>
                            <div className="mt-0.5">
                              <SeverityBadge label={a.severity} withDot={false} className="text-[10px]" />
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Panel>

              {/* District Emergency Capacity Meters */}
              <Panel
                eyebrow="Resource Logistics"
                title="District Capacity Meters"
                subtitle="Healthcare and cooling shelter load"
                ticks
              >
                <div className="p-5 space-y-6">
                  {/* Hospital Beds Meter */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <Building2 size={15} className="text-cyber-cyan" />
                        <span>Hospital Bed Capacity</span>
                      </span>
                      <span className="data-num text-xs font-bold text-slate-200">
                        {overview.hospital_capacity.available_beds} /{" "}
                        {overview.hospital_capacity.total_beds} Available
                      </span>
                    </div>
                    <div className="h-2 bg-base-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-ember-gradient rounded-full"
                        style={{ width: `${overview.hospital_capacity.overall_utilization_pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                      <span>Utilization: {overview.hospital_capacity.overall_utilization_pct.toFixed(0)}%</span>
                      <span>Total ICU: {overview.hospital_capacity.total_icu_beds}</span>
                    </div>
                  </div>

                  {/* Cooling Centers Capacity Meter */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <Fan size={15} className="text-amber-400" />
                        <span>Cooling Center Occupancy</span>
                      </span>
                      <span className="data-num text-xs font-bold text-slate-200">
                        {overview.cooling_center_capacity.total_occupancy} /{" "}
                        {overview.cooling_center_capacity.total_capacity} Persons
                      </span>
                    </div>
                    <div className="h-2 bg-base-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-glow/80 rounded-full"
                        style={{ width: `${overview.cooling_center_capacity.utilization_pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                      <span>Occupancy: {overview.cooling_center_capacity.utilization_pct.toFixed(0)}%</span>
                      <span>Centers Active: {overview.cooling_center_capacity.total_centers}</span>
                    </div>
                  </div>
                </div>
              </Panel>
            </div>

            {/* Section 03: The New §6.2 Ward-in-District Explorer */}
            <section className="space-y-4">
              <SectionHeading
                index="03"
                label="Ward-in-District Granular Explorer"
                hint="State → District → Ward Drilldown & Vulnerability Metrics"
              />
              <WardExplorer />
            </section>

            {/* Emergency Action Directive Recommendations */}
            <Panel
              eyebrow="Advisory Playbook"
              title="Official Emergency Action Directives"
              subtitle="Automated recommendations tailored to current district heat load"
              ticks
            >
              <ul className="p-5 space-y-3">
                {overview.emergency_recommendations.map((r, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-base-850/60 border border-base-750 text-xs sm:text-sm text-slate-300 leading-relaxed"
                  >
                    <span className="w-2 h-2 rounded-full bg-ember-400 mt-1.5 shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}

function GovStatCard({
  icon: Icon,
  label,
  value,
  caption,
  badge,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  caption?: string;
  badge?: boolean;
  color?: string;
}) {
  return (
    <div className="panel p-4 flex flex-col justify-between gap-3">
      <div className="flex items-center justify-between">
        <span className="stat-label text-[10px]">{label}</span>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        {badge ? (
          <SeverityBadge label={value} className="w-fit text-xs px-2.5 py-1" />
        ) : (
          <span className="data-num text-2xl sm:text-3xl font-bold text-white leading-none">
            {value}
          </span>
        )}
        {caption && <p className="text-[10px] font-mono text-slate-500 mt-1">{caption}</p>}
      </div>
    </div>
  );
}
