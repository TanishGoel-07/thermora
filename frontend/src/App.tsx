import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { WardProvider } from "@/context/WardContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Dashboard from "@/pages/Dashboard";
import HeatMapPage from "@/pages/HeatMapPage";
import ForecastPage from "@/pages/ForecastPage";
import AlertsPage from "@/pages/AlertsPage";
import HealthGuidancePage from "@/pages/HealthGuidancePage";
import HospitalsPage from "@/pages/HospitalsPage";
import CoolingCentersPage from "@/pages/CoolingCentersPage";
import EmergencyPlanningPage from "@/pages/EmergencyPlanningPage";
import GovernmentPage from "@/pages/GovernmentPage";
import SettingsPage from "@/pages/SettingsPage";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="w-full min-h-screen"
      >
        <Routes location={location}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/heat-map" element={<HeatMapPage />} />
          <Route path="/forecast" element={<ForecastPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/health-guidance" element={<HealthGuidancePage />} />
          <Route path="/hospitals" element={<HospitalsPage />} />
          <Route path="/cooling-centers" element={<CoolingCentersPage />} />
          <Route path="/emergency-planning" element={<EmergencyPlanningPage />} />
          <Route path="/government" element={<GovernmentPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ErrorBoundary label="Thermora">
      <WardProvider>
        <BrowserRouter>
          <div className="flex min-h-screen bg-base-950 text-slate-100">
            <Sidebar />
            <main className="flex-1 min-w-0">
              <AnimatedRoutes />
            </main>
          </div>
        </BrowserRouter>
      </WardProvider>
    </ErrorBoundary>
  );
}
