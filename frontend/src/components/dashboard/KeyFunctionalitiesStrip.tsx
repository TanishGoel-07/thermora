import { Crosshair, HeartPulse, BrainCircuit, Building2, BellRing } from "lucide-react";
import { motion } from "framer-motion";

const ITEMS = [
  {
    icon: Crosshair,
    title: "Hyperlocal Resolution",
    desc: "Ward-level micro-climate risk resolution powered by NASA POWER, Landsat-8 and PostGIS boundaries.",
    color: "#38BDF8",
  },
  {
    icon: HeartPulse,
    title: "Human Thermal Stress",
    desc: "HTSI model synthesizes Heat Index, WBGT, UTCI, and demographic vulnerability indices.",
    color: "#F59B3C",
  },
  {
    icon: BrainCircuit,
    title: "AI Forecast Ensemble",
    desc: "Multi-horizon ensemble blending XGBoost, Random Forest, and Temporal LSTM neural networks.",
    color: "#A78BFA",
  },
  {
    icon: Building2,
    title: "Hospital Surge Forecast",
    desc: "Anticipates heat stroke admissions, ICU overload, and bed availability prior to peak events.",
    color: "#34D399",
  },
  {
    icon: BellRing,
    title: "Automated Early Alerts",
    desc: "Multi-channel broadcast alerts (SMS, push, WhatsApp) triggered by automated risk thresholds.",
    color: "#EF4444",
  },
];

export function KeyFunctionalitiesStrip() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {ITEMS.map(({ icon: Icon, title, desc, color }, idx) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: idx * 0.05 }}
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="panel p-4 flex flex-col justify-between gap-2.5 hover:border-base-600 transition-colors"
        >
          <div>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 shadow-sm border border-base-700/80"
              style={{ backgroundColor: `${color}18`, color }}
            >
              <Icon size={16} strokeWidth={2.2} />
            </div>
            <p className="font-display text-sm font-bold text-slate-100 tracking-tight">
              {title}
            </p>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {desc}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
