import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { useEffect, useMemo } from "react";
import type { Layer } from "leaflet";
import { Map as MapIcon, Layers, Maximize2 } from "lucide-react";
import { useWardHeatmap } from "@/hooks/useThermoraData";
import { useWardContext } from "@/context/WardContext";
import { Panel } from "@/components/ui/panel";
import { riskColor } from "@/lib/utils";

function FitToBounds({ geojson }: { geojson: any }) {
  const map = useMap();
  useEffect(() => {
    if (!geojson || !geojson.features || geojson.features.length === 0) return;
    const lats: number[] = [];
    const lons: number[] = [];
    geojson.features.forEach((f: any) => {
      if (f.geometry && f.geometry.coordinates) {
        // Handle Polygon and MultiPolygon
        const coords =
          f.geometry.type === "MultiPolygon"
            ? f.geometry.coordinates.flat(2)
            : f.geometry.coordinates[0];

        coords.forEach(([lon, lat]: [number, number]) => {
          if (typeof lat === "number" && typeof lon === "number") {
            lats.push(lat);
            lons.push(lon);
          }
        });
      }
    });

    if (lats.length > 0) {
      map.fitBounds(
        [
          [Math.min(...lats), Math.min(...lons)],
          [Math.max(...lats), Math.max(...lons)],
        ],
        { padding: [24, 24] }
      );
    }
  }, [geojson, map]);
  return null;
}

export function DistrictHeatMap({ height = "h-[450px]" }: { height?: string }) {
  const { data: geojson, isLoading } = useWardHeatmap();
  const { selectedWardId, setSelectedWardId } = useWardContext();

  const styleFn = useMemo(
    () => (feature: any) => {
      const p = feature?.properties ?? {};
      const isSelected = p.ward_id === selectedWardId;
      const fillColor = p.color || riskColor(p.htsi_category);

      return {
        fillColor,
        fillOpacity: isSelected ? 0.75 : 0.5,
        color: isSelected ? "#FFFFFF" : fillColor,
        weight: isSelected ? 2.5 : 1.5,
        opacity: 0.95,
      };
    },
    [selectedWardId]
  );

  function onEachFeature(feature: any, layer: Layer) {
    const p = feature.properties;
    const htsi = p.htsi_score?.toFixed?.(0) ?? p.htsi_score ?? "—";
    const pop = p.population?.toLocaleString?.() ?? p.population ?? "—";

    layer.bindTooltip(
      `<div style="font-family:Inter,sans-serif;min-width:160px;padding:4px">
        <div style="font-size:12px;font-weight:700;color:#FFFFFF;margin-bottom:3px">${p.name}</div>
        <div style="font-size:11px;color:#94A3B8;margin-bottom:2px">HTSI Score: <strong style="color:#F59B3C">${htsi}</strong> · ${p.htsi_category || "Safe"}</div>
        <div style="font-size:10px;color:#64748B">Population: ${pop}</div>
      </div>`,
      { sticky: true, opacity: 0.95 }
    );

    layer.on({
      click: () => {
        if (p.ward_id) setSelectedWardId(p.ward_id);
      },
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({ fillOpacity: 0.8, weight: 2.5 });
      },
      mouseout: (e) => {
        const l = e.target;
        l.setStyle(styleFn(feature));
      },
    });
  }

  return (
    <Panel
      eyebrow="Geographic Intelligence"
      title="Interactive Ward Thermal Heat Map"
      subtitle="Ward-level satellite risk overlay — click any polygon to inspect"
      icon={<MapIcon className="w-4 h-4" />}
      ticks
      className="h-full"
    >
      <div className={`${height} rounded-b-xl2 overflow-hidden relative`}>
        {isLoading || !geojson ? (
          <div className="w-full h-full animate-pulse bg-base-850/80 flex items-center justify-center">
            <span className="mono-label text-slate-400">Loading Geographic Heatmap Boundaries...</span>
          </div>
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
            <GeoJSON
              key={selectedWardId}
              data={geojson as any}
              style={styleFn}
              onEachFeature={onEachFeature}
            />
            <FitToBounds geojson={geojson} />
          </MapContainer>
        )}
      </div>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-base-750/70 text-xs font-mono text-slate-400 bg-base-950/60">
        <div className="flex items-center gap-4">
          <LegendDot color="#10B981" label="Safe (0-44)" />
          <LegendDot color="#F59E0B" label="Caution (45-64)" />
          <LegendDot color="#F97316" label="Danger (65-79)" />
          <LegendDot color="#DC2626" label="Extreme (80-100)" />
        </div>
        <span className="text-slate-500 text-[10px]">
          Vector Polygon Resolution: Ward Centroid
        </span>
      </div>
    </Panel>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}
