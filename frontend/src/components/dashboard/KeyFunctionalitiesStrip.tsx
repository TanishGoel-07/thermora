import { Crosshair, HeartPulse, BrainCircuit, Building2, BellRing } from "lucide-react";

const ITEMS = [
  {
    icon: Crosshair,
    title: "Hyperlocal Prediction",
    desc: "Ward-level risk resolution powered by NASA POWER + PostGIS.",
  },
  {
    icon: HeartPulse,
    title: "Human Thermal Stress",
    desc: "HTSI blends Heat Index, WBGT, UTCI and personal vulnerability.",
  },
  {
    icon: BrainCircuit,
    title: "AI Forecasting",
    desc: "XGBoost + Random Forest + LSTM ensemble for 5-day outlooks.",
  },
  {
    icon: Building2,
    title: "Hospital Planning",
    desc: "Forecasts admissions and ICU surge before it happens.",
  },
  {
    icon: BellRing,
    title: "Smart Alerts",
    desc: "Automatic SMS, email and push alerts at risk thresholds.",
  },
];

export function KeyFunctionalitiesStrip() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {ITEMS.map(({ icon: Icon, title, desc }) => (
        <div key={title} className="panel px-4 py-4 flex flex-col gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-base-800 flex items-center justify-center">
            <Icon size={16} className="text-ember-400" />
          </div>
          <p className="text-sm font-medium text-slate-100">{title}</p>
          <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
        </div>
      ))}
    </div>
  );
}
