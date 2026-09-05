import { Snowflake, Droplets, Clock } from "lucide-react";
import { useCoolingCenters } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";
import { Panel } from "@/components/ui/panel";

export function CoolingCentersPanel() {
  const { selectedWardId, selectedWard } = useWardContext();
  const { data, isLoading } = useCoolingCenters({
    wardId: selectedWardId,
    lat: selectedWard?.centroid_lat,
    lon: selectedWard?.centroid_lon,
  });

  return (
    <Panel title="Cooling Centers" subtitle="Nearest available centers" className="h-full">
      <div className="p-2">
        {isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse bg-base-800/50 rounded-lg" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-slate-500 p-5">No cooling centers registered for this ward.</p>
        ) : (
          <ul className="divide-y divide-base-700/40">
            {data.slice(0, 5).map((c) => {
              const occupancyPct = c.capacity ? (c.current_occupancy / c.capacity) * 100 : 0;
              return (
                <li key={c.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-100 truncate pr-2">{c.name}</p>
                    {c.distance_km !== undefined && c.distance_km !== null && (
                      <span className="text-xs data-num text-slate-400 shrink-0">
                        {c.distance_km.toFixed(1)} km
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                    {c.has_ac && (
                      <span className="flex items-center gap-1">
                        <Snowflake size={12} /> AC
                      </span>
                    )}
                    {c.has_water && (
                      <span className="flex items-center gap-1">
                        <Droplets size={12} /> Water
                      </span>
                    )}
                    {c.is_open_24h && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> 24h
                      </span>
                    )}
                  </div>
                  <div className="mt-2 h-1.5 bg-base-700/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-glow/70 rounded-full"
                      style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {c.current_occupancy} / {c.capacity} occupied
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Panel>
  );
}
