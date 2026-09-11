import { ShieldAlert, Siren, Users, Building, CheckCircle2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import { Panel } from "@/components/ui/panel";
import { useState } from "react";

const PLANS = [
  {
    icon: Siren,
    color: "#EF4444",
    title: "Early Warning & Alert Escalation",
    phase: "Phase 1: T-48 Hours",
    items: [
      "Issue Caution-level advisory bulletins 48 hours prior to predicted heatwave onset.",
      "Escalate to Danger / Extreme Danger alerts automatically as ward HTSI crosses 70.",
      "Synchronize real-time telemetry with municipal disaster response units and district health officers.",
      "Initiate automated SMS and WhatsApp broadcast blasts to registered high-vulnerability citizens.",
    ],
  },
  {
    icon: Users,
    color: "#F59B3C",
    title: "Vulnerable Population Protection Protocol",
    phase: "Phase 2: Outreach Deployment",
    items: [
      "Prioritize wards with elderly population exceeding 12% or high impervious surface density.",
      "Deploy community health workers (ASHA/Anganwadi) for door-to-door hydration checks in top-risk wards.",
      "Distribute Oral Rehydration Salts (ORS) packets and cooling relief packs to outdoor labor clusters.",
      "Enforce mandatory rest-shade cycles on construction and outdoor municipal work sites between 12:00-16:00.",
    ],
  },
  {
    icon: Building,
    color: "#38BDF8",
    title: "Shelter & Hospital Readiness Protocol",
    phase: "Phase 3: Surge Operations",
    items: [
      "Activate standby secondary cooling centers as primary shelter occupancy reaches 70%.",
      "Pre-position intravenous fluids, ice packs, and cooling blankets in district hospital ER wards.",
      "Re-route elective surgical admissions to conserve bed capacity for heat-stroke patients.",
      "Verify auxiliary generator backup and uninterruptible power supply (UPS) across all designated cooling shelters.",
    ],
  },
  {
    icon: ShieldAlert,
    color: "#34D399",
    title: "Public Messaging & Municipal Coordination",
    phase: "Phase 4: Multi-Channel Advisory",
    items: [
      "Broadcast electronic messaging board (VMS) heat alerts across major transit corridors.",
      "Coordinate with public water utility tankers for targeted distribution in low-canopy wards.",
      "Coordinate radio and news media announcements on peak thermal hours and nearest cooling center locations.",
      "Maintain active situational telemetry reporting to State Disaster Management Authority (SDMA).",
    ],
  },
];

export function EmergencyPlanningPage() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col min-h-screen command-grid">
      <Topbar
        title="Emergency Response Playbooks"
        description="Operational protocols, early warning escalation pathways, and inter-agency checklists"
      />

      <div className="flex-1 p-4 lg:p-6 space-y-6 max-w-[1680px] mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PLANS.map(({ icon: Icon, title, items, phase, color }, idx) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.08 }}
            >
              <Panel
                eyebrow={phase}
                title={title}
                ticks
                icon={<Icon className="w-4 h-4" style={{ color }} />}
                className="h-full"
              >
                <div className="p-5 space-y-3">
                  <div className="space-y-2.5">
                    {items.map((item, itemIdx) => {
                      const id = `${title}-${itemIdx}`;
                      const isDone = !!checkedItems[id];

                      return (
                        <div
                          key={item}
                          onClick={() => toggleCheck(id)}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                            isDone
                              ? "bg-emerald-950/20 border-emerald-500/30 text-slate-400"
                              : "bg-base-850/60 border-base-750/70 hover:border-base-600 text-slate-200"
                          }`}
                        >
                          <button
                            type="button"
                            className={`w-5 h-5 rounded-md flex items-center justify-center border mt-0.5 shrink-0 transition-colors ${
                              isDone
                                ? "bg-emerald-500 border-emerald-500 text-base-950"
                                : "border-base-700 bg-base-900"
                            }`}
                          >
                            {isDone && <CheckCircle2 size={13} strokeWidth={3} />}
                          </button>
                          <span
                            className={`text-xs sm:text-sm leading-relaxed ${
                              isDone ? "line-through opacity-75" : ""
                            }`}
                          >
                            {item}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Panel>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EmergencyPlanningPage;
