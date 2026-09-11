import { Snowflake, Navigation, CheckCircle2, Clock, Droplets } from "lucide-react";
import { motion } from "framer-motion";
import { useCoolingCenters } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";
import { Panel } from "@/components/ui/panel";

function occupancyColor(pct: number) {
  if (pct >= 85) return "#DC2626";
  if (pct >= 60) return "#F59E0B";
  return "#10B981";
}

export function CoolingCentersPanel() {
  const { selectedWardId, selectedWard } = useWardContext();
  const { data: rawData, isLoading } = useCoolingCenters({
    wardId: selectedWardId,
    lat: selectedWard?.centroid_lat,
    lon: selectedWard?.centroid_lon,
  });
  const data = Array.isArray(rawData) ? rawData : [];

  return (
    <Panel
      eyebrow="Emergency Relief Network"
      title="Cooling Shelter Centers"
      subtitle="Air-conditioned community relief sites by occupancy"
      icon={<Snowflake className="w-4 h-4" />}
      ticks
      className="h-full"
    >
      <div className="p-4 flex flex-col justify-between h-full">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse bg-base-800/50 rounded-lg" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 font-mono">
            No cooling shelters currently mapped in this ward.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {data.slice(0, 5).map((c, i) => {
              const occupancyPct = c.capacity
                ? (c.current_occupancy / c.capacity) * 100
                : 0;
              const color = occupancyColor(occupancyPct);

              return (
                <motion.li
                  key={c.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  className="rounded-xl border border-base-750/80 bg-base-850/60 p-3 space-y-2 hover:border-base-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-1.5">
                        <Snowflake size={12} className="text-cyber-cyan shrink-0" />
                        <span>{c.name}</span>
                      </p>
                      {c.distance_km !== undefined && c.distance_km !== null && (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                          <Navigation className="w-3 h-3 text-ember-400" />
                          <span>{c.distance_km.toFixed(1)} km away</span>
                          {c.address && (
                            <span className="text-slate-500 truncate max-w-[140px]">
                              · {c.address}
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="data-num text-sm font-bold" style={{ color }}>
                        {occupancyPct.toFixed(0)}%
                      </span>
                      <span className="mono-label text-[9px] text-slate-500 block">
                        {c.current_occupancy}/{c.capacity}
                      </span>
                    </div>
                  </div>

                  {/* Amenities Chips & Capacity Bar */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-base-750/60">
                    <div className="flex items-center gap-1.5">
                      {c.has_ac && <Chip label="HVAC A/C" />}
                      {c.has_water && <Chip label="Potable Water" />}
                      {c.is_open_24h && <Chip label="24 Hours" />}
                    </div>

                    <div className="w-20 h-1.5 rounded-full bg-base-800 overflow-hidden shrink-0">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.min(occupancyPct, 100)}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </Panel>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="rounded px-1.5 py-0.5 text-[9px] font-mono font-medium bg-base-900 border border-base-750 text-slate-300">
      {label}
    </span>
  );
}
