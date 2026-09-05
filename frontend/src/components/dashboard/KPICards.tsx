import { Flame, Activity, Thermometer, Wind, Sun } from "lucide-react";
import { useKPIs } from "@/hooks/useThermoraData";
import { riskTextClass } from "@/lib/utils";

function KPICard({
  icon: Icon,
  label,
  value,
  unit,
  sublabel,
  accent,
}: {
  icon: any;
  label: string;
  value: string;
  unit?: string;
  sublabel?: string;
  accent?: string;
}) {
  return (
    <div className="panel px-5 py-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        <Icon size={15} className="text-slate-500" strokeWidth={2} />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`data-num text-[26px] font-semibold leading-none ${accent ?? "text-slate-100"}`}>
          {value}
        </span>
        {unit && <span className="text-sm text-slate-500">{unit}</span>}
      </div>
      {sublabel && <span className="text-xs text-slate-500">{sublabel}</span>}
    </div>
  );
}

export function KPICards() {
  const { data, isLoading } = useKPIs();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="panel h-[104px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      <KPICard
        icon={Flame}
        label="Current Heat Risk"
        value={data.current_heat_risk.toFixed(0)}
        unit="/ 100"
        sublabel={data.current_heat_risk_level}
        accent={riskTextClass(data.current_heat_risk_level)}
      />
      <KPICard
        icon={Activity}
        label="Human Thermal Stress"
        value={data.htsi_score.toFixed(0)}
        unit="HTSI"
        sublabel={data.htsi_category}
        accent={riskTextClass(data.htsi_category)}
      />
      <KPICard
        icon={Thermometer}
        label="Heat Index"
        value={data.heat_index_c.toFixed(1)}
        unit="°C"
        sublabel="Feels-like temperature"
      />
      <KPICard
        icon={Wind}
        label="WBGT"
        value={data.wbgt_c.toFixed(1)}
        unit="°C"
        sublabel="Wet Bulb Globe Temp"
      />
      <KPICard
        icon={Sun}
        label="UTCI"
        value={data.utci_c.toFixed(1)}
        unit="°C"
        sublabel="Universal Thermal Climate Index"
      />
    </div>
  );
}
