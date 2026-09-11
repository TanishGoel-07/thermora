import { TriangleAlert, ArrowRight, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { useActiveAlert } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";
import { Link } from "react-router-dom";

export function AlertBanner() {
  const { selectedWardId } = useWardContext();
  const { data: alert } = useActiveAlert(selectedWardId);

  if (!alert) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      role="alert"
      className="relative flex flex-col gap-3.5 overflow-hidden rounded-xl border border-red-500/50 bg-red-950/40 p-4 shadow-glow-danger sm:flex-row sm:items-center sm:gap-4 backdrop-blur-md"
    >
      <span className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-red-500" />
      <div className="flex items-center gap-3">
        <span className="pulse-extreme grid w-10 h-10 shrink-0 place-items-center rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
          <TriangleAlert className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="mono-label px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/40 text-[10px]">
              {alert.level.replace("_", " ")}
            </span>
            <span className="mono-label text-slate-400 text-[10px]">
              {new Date(alert.created_at).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <p className="font-display text-sm sm:text-base font-bold text-white mt-0.5">
            {alert.title}
          </p>
        </div>
      </div>
      <p className="flex-1 text-xs sm:text-sm leading-relaxed text-slate-300 sm:border-l sm:border-red-500/30 sm:pl-4">
        {alert.message}
      </p>
      <Link
        to="/alerts"
        className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-red-600 hover:bg-red-500 px-3.5 py-2 text-xs font-bold text-white transition-all shadow-md active:scale-95 sm:self-center"
      >
        <span>View Protocol</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </motion.div>
  );
}
