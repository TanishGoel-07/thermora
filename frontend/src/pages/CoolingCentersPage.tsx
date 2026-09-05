import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Topbar } from "@/components/layout/Topbar";
import { Panel } from "@/components/ui/panel";
import { CoolingCentersPanel } from "@/components/dashboard/CoolingCentersPanel";
import { useCoolingCenters } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";

export default function CoolingCentersPage() {
  const { selectedWard } = useWardContext();
  const { data: centers } = useCoolingCenters({
    lat: selectedWard?.centroid_lat,
    lon: selectedWard?.centroid_lon,
  });

  const center: [number, number] = selectedWard
    ? [selectedWard.centroid_lat, selectedWard.centroid_lon]
    : [28.6692, 77.4538];

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar title="Cooling Centers" description="Find air-conditioned shelters near you" />
      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Panel title="Nearby Centers Map">
            <div className="h-[420px] rounded-b-xl2 overflow-hidden">
              <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                {centers?.map((c) => (
                  <Marker key={c.id} position={[c.latitude, c.longitude]}>
                    <Popup>
                      <strong>{c.name}</strong>
                      <br />
                      Capacity: {c.current_occupancy}/{c.capacity}
                      <br />
                      {c.address}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </Panel>
          <CoolingCentersPanel />
        </div>
      </div>
    </div>
  );
}
