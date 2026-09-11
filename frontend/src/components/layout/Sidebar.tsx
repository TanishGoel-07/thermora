import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Map,
  CloudSun,
  BellRing,
  HeartPulse,
  Building2,
  Fan,
  ShieldAlert,
  Landmark,
  Settings,
  Thermometer,
  Menu,
  X,
  Activity,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAlerts } from "@/hooks/useThermoraData";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/heat-map", label: "Heat Map", icon: Map },
  { to: "/forecast", label: "Forecast & AI", icon: CloudSun },
  { to: "/alerts", label: "Alerts", icon: BellRing, showAlertBadge: true },
  { to: "/health-guidance", label: "Health Guidance", icon: HeartPulse },
  { to: "/hospitals", label: "Hospitals", icon: Building2 },
  { to: "/cooling-centers", label: "Cooling Centers", icon: Fan },
  { to: "/emergency-planning", label: "Emergency Planning", icon: ShieldAlert },
  { to: "/government", label: "Government", icon: Landmark },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { data: activeAlerts } = useAlerts(true);
  const alertCount = activeAlerts?.length ?? 0;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed left-4 top-3.5 z-50 grid w-9 h-9 place-items-center rounded-lg border border-base-700 bg-base-900 text-slate-200 lg:hidden shadow-panel active:scale-95 transition-transform"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* Backdrop for Mobile */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Aside Container */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 inset-y-0 left-0 z-40 w-64 shrink-0 h-screen flex flex-col border-r border-base-750/70 bg-base-950/90 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 select-none",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-base-750/60 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-ember-gradient flex items-center justify-center shadow-glow shrink-0">
            <Thermometer className="text-base-950" size={19} strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-display font-extrabold text-[16px] text-white leading-none tracking-tight flex items-center gap-1.5">
              <span>Thermora</span>
              <span className="w-1.5 h-1.5 rounded-full bg-ember-400 animate-pulse" />
            </div>
            <div className="mono-label mt-1 text-slate-400 font-medium text-[9px]">
              Heatwave Intelligence
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="mono-label px-3 pb-2 pt-1 text-slate-400/80 font-bold text-[9px]">
            Command Center
          </p>

          {NAV_ITEMS.map(({ to, label, icon: Icon, showAlertBadge }) => {
            const isActive =
              to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

            return (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onClick={() => setOpen(false)}
                className="group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all"
              >
                {/* Framer Motion Sliding Pill Active Indicator */}
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-base-850 border border-base-700/80 shadow-sm"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}

                <span className="relative z-10 flex items-center gap-3 w-full">
                  <Icon
                    size={17}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={cn(
                      "transition-colors group-hover:scale-110",
                      isActive ? "text-ember-400" : "text-slate-400 group-hover:text-slate-200"
                    )}
                  />

                  <span
                    className={cn(
                      "flex-1 truncate tracking-tight",
                      isActive ? "text-white font-bold" : "text-slate-400 group-hover:text-slate-200"
                    )}
                  >
                    {label}
                  </span>

                  {showAlertBadge && alertCount > 0 && (
                    <span className="data-num grid w-5 h-5 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-glow-danger animate-pulse">
                      {alertCount}
                    </span>
                  )}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Telemetry Card */}
        <div className="mt-auto p-3 shrink-0">
          <div className="rounded-xl border border-base-750/80 bg-base-900/80 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="mono-label text-slate-400 font-bold text-[9px]">Sensor Telemetry</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="mono-label text-emerald-400 font-bold text-[9px]">Nominal</span>
              </span>
            </div>
            <p className="text-[10px] font-mono leading-tight text-slate-400">
              NASA POWER · OpenWeather · Ward Ground Sensors
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
