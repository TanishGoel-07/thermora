import { useEffect, useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { useWardContext } from "@/context/WardContext";

export function Topbar({ title, description }: { title: string; description?: string }) {
  const { wards, selectedWardId, setSelectedWardId, selectedWard } = useWardContext();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="h-16 border-b border-base-700/50 bg-base-950/40 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between px-6">
      <div>
        <h1 className="font-display font-semibold text-lg leading-none">{title}</h1>
        {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="text-xs text-slate-500">
            {now.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
          </div>
          <div className="text-xs data-num text-slate-400">
            {now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>

        <div className="relative">
          <select
            value={selectedWardId ?? ""}
            onChange={(e) => setSelectedWardId(Number(e.target.value))}
            className="appearance-none bg-base-800 border border-base-600 rounded-lg pl-9 pr-8 py-2 text-sm text-slate-200 focus:outline-none focus:border-ember-500 cursor-pointer"
          >
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <MapPin
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
        </div>

        {selectedWard && (
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="text-[11px] text-slate-500">Population</span>
            <span className="text-xs data-num text-slate-300">
              {selectedWard.population.toLocaleString()}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
