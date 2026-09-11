import { Topbar } from "@/components/layout/Topbar";
import { DistrictHeatMap } from "@/components/dashboard/HeatMap";
import { TopRiskWards } from "@/components/dashboard/TopRiskWards";
import { ThermalStressBreakdown } from "@/components/dashboard/ThermalStressBreakdown";
import { RiskDriversPanel } from "@/components/dashboard/RiskDriversPanel";
import { useWardContext } from "@/context/WardContext";
import { Layers, MapPin } from "lucide-react";

export default function HeatMapPage() {
  const { selectedWard } = useWardContext();

  return (
    <div className="flex flex-col min-h-screen command-grid">
      <Topbar
        title="Geospatial Heat Intelligence Map"
        description="Ward-level satellite thermal overlay, urban heat island boundaries, and vector polygons"
      />

      <div className="flex-1 p-4 lg:p-6 space-y-6 max-w-[1680px] mx-auto w-full">
        {/* Heat Map + Priority Ranking */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <DistrictHeatMap height="h-[520px]" />
          </div>

          <div className="xl:col-span-1 flex flex-col gap-6">
            <TopRiskWards />
          </div>
        </div>

        {/* Detailed Breakdown for Selected Ward */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ThermalStressBreakdown />
          <RiskDriversPanel />
        </div>
      </div>
    </div>
  );
}
