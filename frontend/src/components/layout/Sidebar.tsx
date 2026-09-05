import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Map,
  CloudSun,
  BellRing,
  HeartPulse,
  Building2,
  Fan,
  ShieldAlert,
  Settings,
  Thermometer,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/heat-map", label: "Heat Map", icon: Map },
  { to: "/forecast", label: "Forecast", icon: CloudSun },
  { to: "/alerts", label: "Alerts", icon: BellRing },
  { to: "/health-guidance", label: "Health Guidance", icon: HeartPulse },
  { to: "/hospitals", label: "Hospitals", icon: Building2 },
  { to: "/cooling-centers", label: "Cooling Centers", icon: Fan },
  { to: "/emergency-planning", label: "Emergency Planning", icon: ShieldAlert },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 flex flex-col border-r border-base-700/50 bg-base-950/60">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-base-700/50">
        <div className="w-8 h-8 rounded-lg bg-ember-gradient flex items-center justify-center shadow-glow">
          <Thermometer className="text-base-950" size={18} strokeWidth={2.5} />
        </div>
        <div>
          <div className="font-display font-semibold text-[15px] leading-none tracking-tight">
            Thermora
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Heatwave Intelligence</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group",
                isActive
                  ? "bg-base-800 text-ember-400 font-medium"
                  : "text-slate-400 hover:bg-base-800/60 hover:text-slate-200"
              )
            }
          >
            <Icon size={17} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-base-700/50">
        <div className="rounded-lg bg-base-800/60 border border-base-700/50 p-3">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Data sourced from NASA POWER. Ensemble models: XGBoost · Random Forest · LSTM.
          </p>
        </div>
      </div>
    </aside>
  );
}
