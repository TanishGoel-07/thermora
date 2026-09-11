import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Grid, Crosshair, ArrowUpRight } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { useWardHeatmap } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";
import { riskColor } from "@/lib/utils";

const legend = [
  { label: "Safe", key: "Safe", color: "#10B981" },
  { label: "Caution", key: "Caution", color: "#F59E0B" },
  { label: "Danger", key: "Danger", color: "#F97316" },
  { label: "Extreme", key: "Extreme Danger", color: "#DC2626" },
];

export function WardHeatGrid() {
  const { wards, selectedWardId, setSelectedWardId } = useWardContext();
  const { data: geojson, isLoading } = useWardHeatmap();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const cells = useMemo(() => {
    const htsiByWard = new Map<number, { score: number; category: string }>();
    if (Array.isArray(geojson?.features)) {
      geojson.features.forEach((f) => {
        htsiByWard.set(f.properties.ward_id as number, {
          score: (f.properties.htsi_score as number) ?? 0,
          category: (f.properties.htsi_category as string) ?? "Safe",
        });
      });
    }

    return wards.map((w) => ({
      wardId: w.id,
      name: w.name,
      wardNumber: w.ward_number,
      population: w.population,
      score: htsiByWard.get(w.id)?.score ?? 48,
      category: htsiByWard.get(w.id)?.category ?? "Safe",
    }));
  }, [wards, geojson]);

  const activeWard = cells.find((c) => c.wardId === selectedWardId) ?? cells[0];
  const displayWard = hoveredIdx !== null ? cells[hoveredIdx] : activeWard;

  const cols = Math.min(10, Math.max(5, Math.ceil(Math.sqrt(cells.length * 1.6))));

  return (
    <Panel
      eyebrow="District Thermal Matrix"
      title="Ward Heat Cell Array"
      subtitle="Click any thermal cell to synchronize command dashboard focus"
      icon={<Grid className="w-4 h-4" />}
      ticks
      className="h-full"
      action={
        <div className="hidden sm:flex items-center gap-3">
          {legend.map((l) => (
            <span key={l.key} className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
              <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      }
    >
      <div className="p-5 space-y-4">
        {isLoading || cells.length === 0 ? (
          <div className="h-48 animate-pulse bg-base-800/50 rounded-lg" />
        ) : (
          <>
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {cells.map((cell, i) => {
                const color = riskColor(cell.category);
                const isSelected = cell.wardId === selectedWardId;

                return (
                  <motion.button
                    key={cell.wardId}
                    whileHover={{ scale: 1.15, zIndex: 20 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedWardId(cell.wardId)}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    title={`${cell.name} — HTSI ${cell.score.toFixed(0)}`}
                    aria-label={`${cell.name}, HTSI ${cell.score.toFixed(0)}`}
                    className="relative aspect-square rounded-md border transition-all flex flex-col items-center justify-center cursor-pointer group"
                    style={{
                      backgroundColor: `${color}28`,
                      borderColor: isSelected ? "#F59B3C" : `${color}55`,
                      boxShadow: isSelected ? "0 0 14px rgba(245, 155, 60, 0.4)" : undefined,
                    }}
                  >
                    {isSelected && (
                      <Crosshair className="absolute w-3 h-3 text-ember-400 animate-pulse" />
                    )}
                    <span className="data-num text-[11px] font-bold text-white group-hover:scale-110 transition-transform">
                      {cell.score.toFixed(0)}
                    </span>
                    <span className="text-[8px] font-mono text-slate-400 truncate max-w-full px-0.5">
                      #{cell.wardNumber}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Selected / Hovered Detail Bar */}
            {displayWard && (
              <div className="mt-4 p-3.5 rounded-xl bg-base-950/80 border border-base-750 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-base-950 text-sm"
                    style={{ backgroundColor: riskColor(displayWard.category) }}
                  >
                    #{displayWard.wardNumber}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{displayWard.name}</span>
                      <span className="mono-label text-slate-400 text-[10px]">
                        Pop: {displayWard.population.toLocaleString()}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Zone Status: <strong className="text-slate-200">{displayWard.category}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className="data-num text-2xl font-black leading-none"
                    style={{ color: riskColor(displayWard.category) }}
                  >
                    {displayWard.score.toFixed(0)}
                  </div>
                  <span className="mono-label text-[10px] text-slate-500">HTSI Index</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}
