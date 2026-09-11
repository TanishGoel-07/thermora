import { Flame, Activity, Thermometer, Wind, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useKPIs } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";
import { riskColor } from "@/lib/utils";
import { SeverityBadge } from "@/components/ui/badge";

function KPICard({
  icon: Icon,
  label,
  value,
  unit,
  sublabel,
  color,
  index = 0,
}: {
  icon: any;
  label: string;
  value: string;
  unit?: string;
  sublabel: string;
  color: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className="group relative overflow-hidden rounded-xl border border-base-750/80 bg-base-900/85 p-4 shadow-panel transition-all hover:border-base-600 hover:shadow-glow/10"
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5"
        style={{ background: color }}
      />
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2">
          <span
            className="grid w-7 h-7 place-items-center rounded-md bg-base-800/90 ring-1 ring-base-700/60 shadow-sm"
            style={{ color }}
          >
            <Icon className="w-4 h-4" />
          </span>
          <span className="mono-label text-slate-400 font-medium">{label}</span>
        </span>
      </div>
      <div className="mt-4 flex items-baseline gap-1.5">
        <span
          className="font-display text-3xl font-extrabold tabular-nums leading-none tracking-tight data-num"
          style={{ color }}
        >
          {value}
        </span>
        {unit && <span className="data-num text-xs font-mono text-slate-500">{unit}</span>}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-base-750/70 pt-2.5">
        <SeverityBadge label={sublabel} withDot={false} className="px-2 py-0.5 text-[10px]" />
      </div>
    </motion.div>
  );
}

export function KPICards() {
  const { selectedWardId } = useWardContext();
  const { data, isLoading } = useKPIs(selectedWardId);

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="panel h-[130px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
      <KPICard
        icon={Flame}
        label="Heat Risk Score"
        value={data.current_heat_risk.toFixed(0)}
        unit="/ 100"
        sublabel={data.current_heat_risk_level}
        color={riskColor(data.current_heat_risk_level)}
        index={0}
      />
      <KPICard
        icon={Activity}
        label="Thermal Stress (HTSI)"
        value={data.htsi_score.toFixed(0)}
        unit="HTSI"
        sublabel={data.htsi_category}
        color={riskColor(data.htsi_category)}
        index={1}
      />
      <KPICard
        icon={Thermometer}
        label="Heat Index"
        value={data.heat_index_c.toFixed(1)}
        unit="°C"
        sublabel="Feels-like"
        color="#F59B3C"
        index={2}
      />
      <KPICard
        icon={Wind}
        label="WBGT Stress"
        value={data.wbgt_c.toFixed(1)}
        unit="°C"
        sublabel="Wet Bulb Globe"
        color="#38BDF8"
        index={3}
      />
      <KPICard
        icon={Sun}
        label="UTCI Universal"
        value={data.utci_c.toFixed(1)}
        unit="°C"
        sublabel="Thermal Comfort"
        color="#F59E0B"
        index={4}
      />
    </div>
  );
}
