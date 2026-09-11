import { Phone, BedDouble, Building2, HeartPulse, ShieldAlert } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Panel } from "@/components/ui/panel";
import { HospitalSurgePanel } from "@/components/dashboard/HospitalSurgePanel";
import { useHospitals, useHospitalSurge } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";

export default function HospitalsPage() {
  const { selectedWardId } = useWardContext();
  const { data: rawHospitals, isLoading } = useHospitals(selectedWardId);
  const hospitals = Array.isArray(rawHospitals) ? rawHospitals : [];

  return (
    <div className="flex flex-col min-h-screen command-grid">
      <Topbar
        title="Hospital Capacity & Surge Readiness"
        description="Emergency room bed allocation, ICU surge prediction, and heat-stroke admissions load"
      />

      <div className="flex-1 p-4 lg:p-6 space-y-6 max-w-[1680px] mx-auto w-full">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Hospital Directory (7 cols) */}
          <div className="xl:col-span-7">
            <Panel
              eyebrow="Healthcare Infrastructure"
              title="Hospital Capacity Directory"
              subtitle="Current operational bed availability & contact protocols"
              icon={<Building2 className="w-4 h-4" />}
              ticks
            >
              <div className="p-4">
                {isLoading ? (
                  <div className="space-y-3 p-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-20 animate-pulse bg-base-800/50 rounded-xl" />
                    ))}
                  </div>
                ) : !hospitals || hospitals.length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-500 font-mono">
                    No hospital facilities registered in this ward boundary.
                  </div>
                ) : (
                  <ul className="divide-y divide-base-750/60">
                    {hospitals.map((h) => (
                      <li key={h.id} className="py-3.5 px-2 hover:bg-base-850/40 rounded-xl transition-colors">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                              <HeartPulse size={15} className="text-red-400" />
                              <span>{h.name}</span>
                            </h4>
                            <span className="mono-label text-[10px] text-slate-500 capitalize mt-0.5 block">
                              {h.type} Facility · Ward #{h.ward_id}
                            </span>
                          </div>

                          <span className="px-2.5 py-1 rounded-md bg-base-800 border border-base-700 text-xs font-mono text-slate-300">
                            Available: <strong className="text-emerald-400">{h.available_beds}</strong>/{h.total_beds}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-400 font-mono">
                          <span className="flex items-center gap-1.5">
                            <BedDouble size={13} className="text-cyber-cyan" />
                            <span>Total Beds: <strong className="text-slate-200">{h.available_beds}</strong> / {h.total_beds}</span>
                          </span>

                          <span className="flex items-center gap-1.5">
                            <HeartPulse size={13} className="text-ember-400" />
                            <span>ICU Units: <strong className="text-slate-200">{h.available_icu_beds}</strong> / {h.icu_beds}</span>
                          </span>

                          {h.contact_number && (
                            <span className="flex items-center gap-1.5 text-slate-300">
                              <Phone size={12} className="text-emerald-400" />
                              <span>{h.contact_number}</span>
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Panel>
          </div>

          {/* Hospital Surge Forecast (5 cols) */}
          <div className="xl:col-span-5">
            <HospitalSurgePanel />
          </div>
        </div>
      </div>
    </div>
  );
}
