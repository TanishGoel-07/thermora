import { ShieldAlert, Siren, Users, Building } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Panel } from "@/components/ui/panel";

const PLANS = [
  {
    icon: Siren,
    title: "Early Warning Protocol",
    items: [
      "Issue Caution-level alerts 48h before predicted heatwave onset",
      "Escalate to Danger/Extreme Danger alerts as HTSI crosses thresholds",
      "Notify district health officers and hospital administrators automatically",
    ],
  },
  {
    icon: Users,
    title: "Vulnerable Population Outreach",
    items: [
      "Prioritize wards with elderly population % above district average",
      "Coordinate door-to-door checks in extreme-danger wards",
      "Distribute ORS and cooling kits through community health workers",
    ],
  },
  {
    icon: Building,
    title: "Facility Readiness",
    items: [
      "Activate additional cooling center capacity when occupancy exceeds 70%",
      "Pre-position ICU surge staffing based on hospital surge predictions",
      "Ensure backup power for cooling centers during grid strain",
    ],
  },
  {
    icon: ShieldAlert,
    title: "Public Communication",
    items: [
      "Push SMS/email/app alerts to registered residents in affected wards",
      "Coordinate with local media for Extreme Danger broadcast advisories",
      "Publish daily HTSI and forecast summaries on public dashboards",
    ],
  },
];

export default function EmergencyPlanningPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Emergency Planning" description="Operational playbooks for heatwave response" />
      <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLANS.map(({ icon: Icon, title, items }) => (
          <Panel key={title} title={title}>
            <div className="p-5">
              <div className="w-9 h-9 rounded-lg bg-ember-500/10 flex items-center justify-center mb-4">
                <Icon size={17} className="text-ember-400" />
              </div>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm text-slate-300 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-ember-400 mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
