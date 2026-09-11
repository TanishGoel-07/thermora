import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Snowflake, Navigation, Building2, Clock, Droplets, Wind } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Panel } from "@/components/ui/panel";
import { CoolingCentersPanel } from "@/components/dashboard/CoolingCentersPanel";
import { useCoolingCenters } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";

// Custom dark mode Leaflet marker icon
const coolingIcon = new L.DivIcon({
  className: "custom-div-icon",
  html: `<div style="background-color:#38BDF8;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #FFFFFF;box-shadow:0 0 12px rgba(56,189,248,0.7)">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#06080C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M12 2v20"/><path d="m4.93 4.93 14.14 14.14"/><path d="m19.07 4.93-14.14 14.14"/></svg>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export default function CoolingCentersPage() {
  const { selectedWard } = useWardContext();
  const { data: rawCenters } = useCoolingCenters({
    lat: selectedWard?.centroid_lat,
    lon: selectedWard?.centroid_lon,
  });
  const centers = Array.isArray(rawCenters) ? rawCenters : [];

  const center: [number, number] = selectedWard
    ? [selectedWard.centroid_lat, selectedWard.centroid_lon]
    : [28.6692, 77.4538];

  return (
    <div className="flex flex-col min-h-screen command-grid">
      <Topbar
        title="Cooling Centers & Relief Shelters"
        description="Public air-conditioned shelters, emergency hydration points, and live capacity tracking"
      />

      <div className="flex-1 p-4 lg:p-6 space-y-6 max-w-[1680px] mx-auto w-full">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Interactive Cooling Center Map (7 cols) */}
          <div className="xl:col-span-7">
            <Panel
              eyebrow="Spatial Relief Network"
              title="Nearby Cooling Centers Map"
              subtitle={`Mapped around ${selectedWard?.name ?? "Selected Ward"} centroid coordinates`}
              icon={<Snowflake className="w-4 h-4" />}
              ticks
            >
              <div className="h-[520px] rounded-b-xl2 overflow-hidden">
                <MapContainer
                  center={center}
                  zoom={13}
                  scrollWheelZoom={true}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  />
                  {centers.map((c) => (
                    <Marker
                      key={c.id}
                      position={[c.latitude, c.longitude]}
                      icon={coolingIcon}
                    >
                      <Popup>
                        <div className="p-1 space-y-1">
                          <h4 className="font-bold text-sm text-white">{c.name}</h4>
                          <p className="text-xs text-slate-300">
                            Occupancy:{" "}
                            <strong className="text-ember-400">
                              {c.current_occupancy} / {c.capacity}
                            </strong>
                          </p>
                          {c.address && (
                            <p className="text-[11px] text-slate-400">{c.address}</p>
                          )}
                          <div className="pt-1 flex gap-1 text-[10px] text-cyber-cyan font-mono">
                            {c.has_ac && <span>• A/C</span>}
                            {c.has_water && <span>• Water</span>}
                            {c.is_open_24h && <span>• 24h</span>}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </Panel>
          </div>

          {/* List & Live Capacity Panel (5 cols) */}
          <div className="xl:col-span-5">
            <CoolingCentersPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
