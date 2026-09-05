import { Topbar } from "@/components/layout/Topbar";
import { KPICards } from "@/components/dashboard/KPICards";
import { AlertPanel } from "@/components/dashboard/AlertPanel";
import { DistrictHeatMap } from "@/components/dashboard/HeatMap";
import { TopRiskWards } from "@/components/dashboard/TopRiskWards";
import { ForecastPanel } from "@/components/dashboard/ForecastPanel";
import { ThermalStressBreakdown } from "@/components/dashboard/ThermalStressBreakdown";
import { RiskDriversPanel } from "@/components/dashboard/RiskDriversPanel";
import { HospitalSurgePanel } from "@/components/dashboard/HospitalSurgePanel";
import { CoolingCentersPanel } from "@/components/dashboard/CoolingCentersPanel";
import { KeyFunctionalitiesStrip } from "@/components/dashboard/KeyFunctionalitiesStrip";

export default function Dashboard() {
  return (
    <div className="flex flex-col min-h-screen">
      <Topbar
        title="Command Dashboard"
        description="Real-time heat risk, thermal stress, and hospital-surge intelligence"
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Top: KPI cards + Alert panel */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">
            <KPICards />
          </div>
          <div className="xl:col-span-1 xl:row-span-2">
            <AlertPanel />
          </div>

          {/* Middle row: Heat map / Top risk wards / Forecast */}
          <div className="xl:col-span-2">
            <DistrictHeatMap />
          </div>
          <div className="xl:col-span-1">
            <TopRiskWards />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-1">
            <ForecastPanel />
          </div>
          <div className="xl:col-span-2">
            <ThermalStressBreakdown />
          </div>
          <div className="xl:col-span-1">
            <RiskDriversPanel />
          </div>
        </div>

        {/* Bottom section: Hospital surge + cooling centers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HospitalSurgePanel />
          <CoolingCentersPanel />
        </div>

        {/* Bottom strip: key functionalities */}
        <KeyFunctionalitiesStrip />
      </div>
    </div>
  );
}
