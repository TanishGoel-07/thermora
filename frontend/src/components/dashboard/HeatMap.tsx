import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { useEffect, useMemo } from "react";
import type { Layer } from "leaflet";
import { useWardHeatmap } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";
import { Panel } from "@/components/ui/panel";

function FitToBounds({ geojson }: { geojson: any }) {
  const map = useMap();
  useEffect(() => {
    if (!geojson || geojson.features.length === 0) return;
    const lats: number[] = [];
    const lons: number[] = [];
    geojson.features.forEach((f: any) => {
      f.geometry.coordinates[0].forEach(([lon, lat]: [number, number]) => {
        lats.push(lat);
        lons.push(lon);
      });
    });
    if (lats.length) {
      map.fitBounds([
        [Math.min(...lats), Math.min(...lons)],
        [Math.max(...lats), Math.max(...lons)],
      ]);
    }
  }, [geojson, map]);
  return null;
}

export function DistrictHeatMap() {
  const { data: geojson, isLoading } = useWardHeatmap();
  const { setSelectedWardId } = useWardContext();

  const styleFn = useMemo(
    () => (feature: any) => ({
      fillColor: feature.properties.color,
      fillOpacity: 0.45,
      color: feature.properties.color,
      weight: 1.5,
      opacity: 0.9,
    }),
    []
  );

  function onEachFeature(feature: any, layer: Layer) {
    const p = feature.properties;
    layer.bindTooltip(
      `<div style="font-family:Inter,sans-serif;min-width:150px">
        <strong>${p.name}</strong><br/>
        HTSI: ${p.htsi_score?.toFixed?.(0) ?? p.htsi_score} — ${p.htsi_category}<br/>
        Population: ${p.population?.toLocaleString?.() ?? p.population}
      </div>`,
      { sticky: true }
    );
    layer.on("click", () => setSelectedWardId(p.ward_id));
  }

  return (
    <Panel title="Interactive District Heat Map" subtitle="Ward-level risk overlay" className="h-full">
      <div className="h-[420px] rounded-b-xl2 overflow-hidden">
        {isLoading || !geojson ? (
          <div className="w-full h-full animate-pulse bg-base-800/50" />
        ) : (
          <MapContainer
            center={[28.6692, 77.4538]}
            zoom={12}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <GeoJSON data={geojson as any} style={styleFn} onEachFeature={onEachFeature} />
            <FitToBounds geojson={geojson} />
          </MapContainer>
        )}
      </div>
      <div className="flex items-center gap-4 px-5 py-3 border-t border-base-700/50 text-xs text-slate-400">
        <LegendDot color="#3ADB8A" label="Safe" />
        <LegendDot color="#F2C94C" label="Caution" />
        <LegendDot color="#F2994A" label="Danger" />
        <LegendDot color="#EB5757" label="Extreme" />
      </div>
    </Panel>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </div>
  );
}
