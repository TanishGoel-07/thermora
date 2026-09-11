import { useEffect, useState } from "react";
import { ChevronDown, MapPin, Radio, Users, Compass, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWardContext } from "@/context/WardContext";
import { WardExplorer } from "@/components/geo/WardExplorer";

function Selector({
  icon,
  label,
  value,
  options,
  onChange,
}: {
  icon?: React.ReactNode;
  label: string;
  value: number | undefined;
  options: { id: number; name: string }[];
  onChange: (id: number) => void;
}) {
  return (
    <label className="group flex items-center gap-2 rounded-lg border border-base-750 bg-base-900/90 px-2.5 py-1.5 transition-all hover:border-base-600 cursor-pointer">
      {icon}
      <span className="flex flex-col leading-none">
        <span className="mono-label text-slate-500 text-[8px]">{label}</span>
        <span className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-slate-200">
          <select
            value={value ?? ""}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-label={label}
            className="cursor-pointer appearance-none bg-transparent pr-1 font-semibold text-slate-200 outline-none"
          >
            {options.map((o) => (
              <option key={o.id} value={o.id} className="bg-base-900 text-slate-200">
                {o.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-ember-400 transition-colors" />
        </span>
      </span>
    </label>
  );
}

export function Topbar({
  title,
  description,
}: {
  title: string;
  description?: string;
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

  const [time, setTime] = useState("");
  const [explorerOpen, setExplorerOpen] = useState(false);

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-base-750/70 bg-base-950/85 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
          {/* Title Area */}
          <div className="mr-auto min-w-0">
            <div className="flex items-center gap-2">
              <span className="mono-label text-ember-500 font-bold text-[9px]">
                Heat Command Center
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-950/40 px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="mono-label text-emerald-400 font-bold text-[9px]">
                  Real-Time
                </span>
              </span>
            </div>
            <h1 className="mt-0.5 truncate font-display font-bold text-lg sm:text-xl text-white tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">
                {description}
              </p>
            )}
          </div>

          {/* Quick Ward Explorer Trigger Button */}
          <button
            onClick={() => setExplorerOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-base-850 border border-base-700 hover:border-ember-500/60 text-xs font-mono text-slate-200 hover:text-ember-400 transition-all shadow-sm active:scale-95"
          >
            <Compass size={14} className="text-ember-400" />
            <span>Ward Explorer</span>
          </button>

          {/* Telemetry: Population & Clock */}
          <div className="hidden items-center gap-2.5 md:flex">
            {selectedWard && (
              <span className="flex items-center gap-1.5 rounded-lg border border-base-750 bg-base-900/90 px-3 py-1.5 text-xs text-slate-400">
                <Users className="w-3.5 h-3.5 text-cyber-cyan" />
                <span className="data-num text-white font-bold">
                  {selectedWard.population.toLocaleString()}
                </span>
                <span>residents</span>
              </span>
            )}

            <span className="flex flex-col rounded-lg border border-base-750 bg-base-900/90 px-3 py-1.5 leading-none">
              <span className="mono-label text-slate-500 text-[8px]">IST CLOCK</span>
              <span className="data-num mt-0.5 text-xs font-bold text-white tracking-wider">
                {time || "--:--:--"}
              </span>
            </span>
          </div>

          {/* Hierarchy Selectors (State, District, Ward) */}
          <div className="flex w-full items-center gap-2 border-t border-base-750/70 pt-2.5 md:w-auto md:border-t-0 md:pt-0">
            <Selector
              icon={<MapPin className="w-3.5 h-3.5 text-ember-400" />}
              label="State"
              value={selectedStateId}
              options={states.map((s) => ({ id: s.id, name: s.name }))}
              onChange={setSelectedStateId}
            />
            <Selector
              label="District"
              value={selectedDistrictId}
              options={districts.map((d) => ({ id: d.id, name: d.name }))}
              onChange={setSelectedDistrictId}
            />
            <Selector
              icon={<Radio className="w-3.5 h-3.5 text-cyber-cyan" />}
              label="Ward"
              value={selectedWardId}
              options={wards.map((w) => ({ id: w.id, name: w.name }))}
              onChange={setSelectedWardId}
            />
          </div>
        </div>
      </header>

      {/* Ward Explorer Modal / Drawer */}
      <AnimatePresence>
        {explorerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl bg-base-900 border border-base-700 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-base-750">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-ember-400" />
                  <h3 className="font-display font-bold text-lg text-white">
                    Hierarchical Ward Explorer
                  </h3>
                </div>
                <button
                  onClick={() => setExplorerOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-base-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1">
                <WardExplorer onWardSelect={() => setExplorerOpen(false)} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
