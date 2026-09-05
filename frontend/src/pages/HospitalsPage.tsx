import { Phone, BedDouble } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Panel } from "@/components/ui/panel";
import { HospitalSurgePanel } from "@/components/dashboard/HospitalSurgePanel";
import { useHospitals } from "@/hooks/useThermoraData";

export default function HospitalsPage() {
  const { data: hospitals, isLoading } = useHospitals();

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Hospitals" description="Bed capacity and heat-stroke surge planning" />
      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Panel title="Hospital Directory">
            <div className="p-2">
              {isLoading ? (
                <div className="p-5 space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 animate-pulse bg-base-800/50 rounded-lg" />
                  ))}
                </div>
              ) : (
                <ul className="divide-y divide-base-700/40">
                  {hospitals?.map((h) => (
                    <li key={h.id} className="px-4 py-3.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-100">{h.name}</p>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-base-800 text-slate-400 capitalize">
                          {h.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <BedDouble size={12} /> {h.available_beds}/{h.total_beds} beds
                        </span>
                        <span className="flex items-center gap-1">
                          <BedDouble size={12} /> {h.available_icu_beds}/{h.icu_beds} ICU
                        </span>
                        {h.contact_number && (
                          <span className="flex items-center gap-1">
                            <Phone size={12} /> {h.contact_number}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>
          <HospitalSurgePanel />
        </div>
      </div>
    </div>
  );
}
