import { Topbar } from "@/components/layout/Topbar";
import { DistrictHeatMap } from "@/components/dashboard/HeatMap";
import { TopRiskWards } from "@/components/dashboard/TopRiskWards";
import { ThermalStressBreakdown } from "@/components/dashboard/ThermalStressBreakdown";

export default function HeatMapPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Heat Map" description="Ward-level urban heat and thermal-stress overlay" />
      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <DistrictHeatMap />
          </div>
          <div className="xl:col-span-1">
            <TopRiskWards />
          </div>
        </div>
        <ThermalStressBreakdown />
      </div>
    </div>
  );
}
