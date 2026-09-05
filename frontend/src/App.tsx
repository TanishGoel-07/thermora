import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { WardProvider } from "@/context/WardContext";
import Dashboard from "@/pages/Dashboard";
import HeatMapPage from "@/pages/HeatMapPage";
import ForecastPage from "@/pages/ForecastPage";
import AlertsPage from "@/pages/AlertsPage";
import HealthGuidancePage from "@/pages/HealthGuidancePage";
import HospitalsPage from "@/pages/HospitalsPage";
import CoolingCentersPage from "@/pages/CoolingCentersPage";
import EmergencyPlanningPage from "@/pages/EmergencyPlanningPage";
import SettingsPage from "@/pages/SettingsPage";

export default function App() {
  return (
    <WardProvider>
      <BrowserRouter>
        <div className="flex">
          <Sidebar />
          <main className="flex-1 min-w-0">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/heat-map" element={<HeatMapPage />} />
              <Route path="/forecast" element={<ForecastPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/health-guidance" element={<HealthGuidancePage />} />
              <Route path="/hospitals" element={<HospitalsPage />} />
              <Route path="/cooling-centers" element={<CoolingCentersPage />} />
              <Route path="/emergency-planning" element={<EmergencyPlanningPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </WardProvider>
  );
}
