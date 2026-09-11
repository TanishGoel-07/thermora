import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Search,
  ArrowRight,
  TrendingUp,
  Trees,
  Building,
  Users,
  ChevronRight,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { useWardContext } from "@/context/WardContext";
import { useWardHeatmap } from "@/hooks/useThermoraData";
import { SeverityBadge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { cn, riskColor } from "@/lib/utils";

export function WardExplorer({
  className,
  onWardSelect,
}: {
  className?: string;
  onWardSelect?: (wardId: number) => void;
}) {
  const {
    states,
    districts,
    wards,
    selectedStateId,
    selectedDistrictId,
    selectedWardId,
    setSelectedStateId,
    setSelectedDistrictId,
    setSelectedWardId,
    selectedWard,
  } = useWardContext();

  const { data: heatmap } = useWardHeatmap();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"risk" | "population" | "vegetation" | "elderly">("risk");

  // Map HTSI risk score from heatmap geojson features
  const wardRiskMap = useMemo(() => {
    const map = new Map<number, { score: number; category: string }>();
    if (Array.isArray(heatmap?.features)) {
      heatmap.features.forEach((f) => {
        const p = f.properties;
        if (p.ward_id) {
          map.set(p.ward_id, {
            score: p.htsi_score ?? 50,
            category: p.htsi_category ?? "Safe",
          });
        }
      });
    }
    return map;
  }, [heatmap]);

  // Enriched and sorted wards
  const filteredWards = useMemo(() => {
    let list = wards.map((w) => {
      const risk = wardRiskMap.get(w.id) ?? { score: 45, category: "Moderate" };
      return {
        ...w,
        riskScore: risk.score,
        riskCategory: risk.category,
      };
    });

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          String(w.ward_number).includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === "risk") return b.riskScore - a.riskScore;
      if (sortBy === "population") return b.population - a.population;
      if (sortBy === "vegetation") return a.vegetation_index - b.vegetation_index; // lower vegetation = higher risk
      if (sortBy === "elderly") return b.elderly_population_pct - a.elderly_population_pct;
      return 0;
    });

    return list;
  }, [wards, wardRiskMap, search, sortBy]);

  const selectedState = states.find((s) => s.id === selectedStateId);
  const selectedDistrict = districts.find((d) => d.id === selectedDistrictId);

  const handleSelectWard = (id: number) => {
    setSelectedWardId(id);
    if (onWardSelect) onWardSelect(id);
  };

  return (
    <Panel
      eyebrow="Geographic Hierarchy"
      title="Ward-in-District Explorer"
      subtitle={`Drill down across ${selectedState?.name ?? "State"} · ${selectedDistrict?.name ?? "District"} wards`}
      icon={<MapPin className="w-4 h-4" />}
      ticks
      className={cn("h-full", className)}
    >
      <div className="p-5 space-y-4">
        {/* Breadcrumb Navigation / Hierarchy Selector */}
        <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-base-950/80 border border-base-750/70 text-xs">
          {/* State Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="mono-label text-slate-500">State:</span>
            <select
              value={selectedStateId ?? ""}
              onChange={(e) => setSelectedStateId(Number(e.target.value))}
              aria-label="State selector"
              className="bg-base-850 text-slate-200 rounded px-2 py-1 border border-base-700 font-medium text-xs outline-none cursor-pointer hover:border-ember-500/60"
            >
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <ChevronRight size={13} className="text-slate-600 shrink-0" />

          {/* District Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="mono-label text-slate-500">District:</span>
            <select
              value={selectedDistrictId ?? ""}
              onChange={(e) => setSelectedDistrictId(Number(e.target.value))}
              aria-label="District selector"
              className="bg-base-850 text-slate-200 rounded px-2 py-1 border border-base-700 font-medium text-xs outline-none cursor-pointer hover:border-ember-500/60"
            >
              {districts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <ChevronRight size={13} className="text-slate-600 shrink-0" />

          {/* Current Active Ward Tag */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="mono-label text-slate-500">Selected Ward:</span>
            <span className="px-2 py-0.5 rounded bg-ember-500/15 text-ember-400 font-semibold border border-ember-500/30 text-xs font-mono">
              {selectedWard ? selectedWard.name : "None"}
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search ward name or #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-base-850 border border-base-700 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-ember-500/70"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
            <SlidersHorizontal size={13} className="text-slate-500" />
            <span className="mono-label text-slate-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sort wards"
              className="bg-base-850 text-slate-200 rounded px-2.5 py-1 border border-base-700 font-medium text-xs outline-none cursor-pointer"
            >
              <option value="risk">Thermal Risk (Highest)</option>
              <option value="population">Population (Largest)</option>
              <option value="vegetation">Vegetation Deficit</option>
              <option value="elderly">Elderly Population %</option>
            </select>
          </div>
        </div>

        {/* Wards Grid / List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
          <AnimatePresence mode="popLayout">
            {filteredWards.map((w, index) => {
              const isSelected = w.id === selectedWardId;
              const color = riskColor(w.riskCategory);

              return (
                <motion.div
                  key={w.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: Math.min(0.2, index * 0.03) }}
                  onClick={() => handleSelectWard(w.id)}
                  className={cn(
                    "p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group relative overflow-hidden",
                    isSelected
                      ? "bg-base-800 border-ember-500 shadow-glow"
                      : "bg-base-850/70 border-base-750 hover:border-base-600 hover:bg-base-800/80"
                  )}
                >
                  <span
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: color }}
                  />

                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-100 group-hover:text-ember-400 transition-colors">
                          {w.name}
                        </span>
                        {isSelected && (
                          <Check size={13} className="text-ember-400 font-bold" />
                        )}
                      </div>
                      <span className="mono-label text-slate-500 text-[10px]">
                        Ward #{w.ward_number}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className="data-num text-lg font-bold"
                        style={{ color }}
                      >
                        {w.riskScore.toFixed(0)}
                      </span>
                      <span className="mono-label block text-[9px] text-slate-500">
                        HTSI
                      </span>
                    </div>
                  </div>

                  {/* Metrics Bar */}
                  <div className="grid grid-cols-3 gap-1 pt-2 border-t border-base-750/60 text-[10px] font-mono">
                    <div className="p-1.5 rounded bg-base-900/60 text-center">
                      <span className="text-slate-500 block truncate flex items-center justify-center gap-1">
                        <Users size={10} /> Pop
                      </span>
                      <span className="text-slate-200 font-semibold data-num">
                        {(w.population / 1000).toFixed(0)}k
                      </span>
                    </div>

                    <div className="p-1.5 rounded bg-base-900/60 text-center">
                      <span className="text-slate-500 block truncate flex items-center justify-center gap-1">
                        <Trees size={10} /> Veg
                      </span>
                      <span className="text-slate-200 font-semibold data-num">
                        {(w.vegetation_index * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="p-1.5 rounded bg-base-900/60 text-center">
                      <span className="text-slate-500 block truncate flex items-center justify-center gap-1">
                        <Building size={10} /> Imp
                      </span>
                      <span className="text-slate-200 font-semibold data-num">
                        {(w.impervious_surface_pct * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Footer Status */}
                  <div className="flex items-center justify-between pt-1">
                    <SeverityBadge label={w.riskCategory} className="text-[10px] px-2 py-0" />
                    <span className="text-[11px] text-slate-500 group-hover:text-slate-300 flex items-center gap-1 transition-colors font-mono">
                      <span>Select</span>
                      <ArrowRight size={11} />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </Panel>
  );
}
