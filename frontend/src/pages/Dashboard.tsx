import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/Topbar";
import { SectionHeading } from "@/components/ui/panel";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AlertBanner } from "@/components/dashboard/AlertBanner";
import { ExecutiveHero } from "@/components/dashboard/ExecutiveHero";
import { KPICards } from "@/components/dashboard/KPICards";
import { AiInsights } from "@/components/dashboard/AiInsights";
import { WardHeatGrid } from "@/components/dashboard/WardHeatGrid";
import { AlertPanel } from "@/components/dashboard/AlertPanel";
import { ForecastStrip } from "@/components/dashboard/ForecastStrip";
import { TopRiskWards } from "@/components/dashboard/TopRiskWards";
import { ThermalStressBreakdown } from "@/components/dashboard/ThermalStressBreakdown";
import { HospitalSurgePanel } from "@/components/dashboard/HospitalSurgePanel";
import { CoolingCentersPanel } from "@/components/dashboard/CoolingCentersPanel";
import { KeyFunctionalitiesStrip } from "@/components/dashboard/KeyFunctionalitiesStrip";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Dashboard() {
  return (
    <div className="flex flex-col min-h-screen command-grid">
      <Topbar
        title="Tactical Command Dashboard"
        description="Real-time multi-sensor thermal stress, heatwave forecasting, and emergency surge intelligence"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 mx-auto w-full max-w-[1680px] space-y-8 px-4 py-6 lg:px-6"
      >
        <motion.div variants={itemVariants}>
          <AlertBanner />
        </motion.div>

        {/* Section 01: Situation Overview */}
        <motion.section variants={itemVariants} className="space-y-4">
          <SectionHeading
            index="01"
            label="Live Situation Overview"
            hint="Satellite 3D Field · Real-Time HTSI Instrument"
          />
          <ErrorBoundary compact label="Executive overview">
            <ExecutiveHero />
          </ErrorBoundary>
          <ErrorBoundary compact label="KPI cards">
            <KPICards />
          </ErrorBoundary>
        </motion.section>

        {/* Section 02: Predictive Intelligence */}
        <motion.section variants={itemVariants} className="space-y-4">
          <SectionHeading
            index="02"
            label="Predictive Ensemble & Spatial Matrix"
            hint="XGBoost · Random Forest · LSTM · Ground Sensors"
          />
          <ErrorBoundary compact label="AI insights">
            <AiInsights />
          </ErrorBoundary>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <ErrorBoundary compact label="Ward heat grid">
                <WardHeatGrid />
              </ErrorBoundary>
            </div>
            <ErrorBoundary compact label="Alert panel">
              <AlertPanel />
            </ErrorBoundary>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <ErrorBoundary compact label="Forecast strip">
                <ForecastStrip />
              </ErrorBoundary>
            </div>
            <ErrorBoundary compact label="Top risk wards">
              <TopRiskWards />
            </ErrorBoundary>
          </div>
        </motion.section>

        {/* Section 03: Response & Capacity */}
        <motion.section variants={itemVariants} className="space-y-4">
          <SectionHeading
            index="03"
            label="Response Infrastructure & Resource Buffers"
            hint="ER Beds · Cooling Centers · Bio-stress Drivers"
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ErrorBoundary compact label="Thermal stress breakdown">
              <ThermalStressBreakdown />
            </ErrorBoundary>
            <ErrorBoundary compact label="Hospital surge panel">
              <HospitalSurgePanel />
            </ErrorBoundary>
            <ErrorBoundary compact label="Cooling centers panel">
              <CoolingCentersPanel />
            </ErrorBoundary>
          </div>
        </motion.section>

        {/* Section 04: Key Capabilities */}
        <motion.section variants={itemVariants} className="space-y-4">
          <SectionHeading
            index="04"
            label="System Capabilities"
            hint="Platform Architecture & Algorithms"
          />
          <KeyFunctionalitiesStrip />
        </motion.section>

        {/* Footer */}
        <footer className="flex flex-col items-center justify-between gap-3 border-t border-base-750/60 pt-6 pb-2 text-center sm:flex-row sm:text-left text-xs font-mono text-slate-400">
          <p className="mono-label text-slate-400">
            Thermora · AI-Powered Urban Heat Risk Intelligence Platform
          </p>
          <p className="text-[11px] text-slate-400">
            Data feeds: NASA POWER · OpenWeather API · PostGIS Ward Centroids
          </p>
        </footer>
      </motion.div>
    </div>
  );
}
