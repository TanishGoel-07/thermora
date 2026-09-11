import { Activity, Lightbulb, Thermometer, Droplets, Wind, Sun, UserCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useWardBreakdown } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";
import { Panel } from "@/components/ui/panel";

const COLORS = ["#F59B3C", "#38BDF8", "#A78BFA", "#F97316", "#EF4444"];

const ICONS: Record<string, any> = {
  Temperature: Thermometer,
  Humidity: Droplets,
  Wind: Wind,
  "Solar Radiation": Sun,
  "Personal Vulnerability": UserCheck,
};

export function ThermalStressBreakdown() {
  const { selectedWardId } = useWardContext();
  const { data: rawData, isLoading } = useWardBreakdown(selectedWardId);
  const data = Array.isArray(rawData) ? rawData : [];

  const topDriver = data[0];

  return (
    <Panel
      eyebrow="Biometeorology Breakdown"
      title="Thermal Stress Components"
      subtitle="Factor contributions driving the HTSI index"
      icon={<Activity className="w-4 h-4" />}
      ticks
      className="h-full"
    >
      <div className="p-5 flex flex-col justify-between h-full space-y-4">
        {isLoading ? (
          <div className="h-48 animate-pulse bg-base-800/50 rounded-lg" />
        ) : data.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 font-mono">
            No thermal stress breakdown available.
          </div>
        ) : (
          <>
            <div className="space-y-3.5">
              {data.map((d, i) => {
                const Icon = ICONS[d.factor] || Activity;
                const color = COLORS[i % COLORS.length];

                return (
                  <motion.div
                    key={d.factor}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                  >
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-200 flex items-center gap-1.5">
                        <Icon size={13} style={{ color }} />
                        <span>{d.factor}</span>
                      </span>
                      <span className="data-num text-slate-300 font-bold">
                        {d.contribution_pct.toFixed(0)}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-base-800">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${d.contribution_pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ backgroundColor: color }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {topDriver && (
              <div className="p-3.5 rounded-xl border border-ember-500/30 bg-ember-500/10 mt-auto">
                <div className="flex items-center gap-2 text-ember-400 font-bold text-xs">
                  <Lightbulb size={14} />
                  <span>Dominant Risk Driver: {topDriver.factor}</span>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {topDriver.explanation}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}
