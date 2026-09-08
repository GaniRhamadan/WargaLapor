import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

export interface HeatmapDetailPoint {
  id?: number;
  lat: number;
  lng: number;
  weight: number;
  title?: string;
  category?: string;
  priority?: string;
}

interface HeatmapLayerProps {
  points: [number, number, number][];
  radius?: number;
  blur?: number;
  max?: number;
  minOpacity?: number;
}

const HeatmapLayer: React.FC<HeatmapLayerProps> = ({
  points,
  radius = 35,
  blur = 22,
  max = 0.8,
  minOpacity = 0.45,
}) => {
  const map = useMap();
  const layerRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const initHeatmap = async () => {
      if (!map || points.length === 0) {
        if (layerRef.current && map) {
          try {
            map.removeLayer(layerRef.current);
          } catch {
            // Ignore error during cleanup
          }
          layerRef.current = null;
        }
        return;
      }

      // Ensure Leaflet is on window for leaflet plugins
      if (typeof window !== 'undefined') {
        (window as any).L = L;
      }

      // Dynamically import leaflet.heat if not yet attached
      if (!(L as any).heatLayer) {
        try {
          await import('leaflet.heat');
        } catch (err) {
          console.error('Failed to load leaflet.heat plugin:', err);
          return;
        }
      }

      if (!isMounted) return;

      // Remove existing heat layer if any
      if (layerRef.current) {
        try {
          map.removeLayer(layerRef.current);
        } catch {
          // Ignore
        }
        layerRef.current = null;
      }

      try {
        // Create heat layer with vibrant intensity gradient
        // Note: Do NOT set maxZoom high because Leaflet.heat will divide weight by 2^(maxZoom - zoom),
        // reducing intensity by 32x-128x at city zoom levels!
        const heat = (L as any).heatLayer(points, {
          radius,
          blur,
          max,
          minOpacity,
          maxZoom: 12, // Prevents aggressive weight downscaling at zoom >= 12
          gradient: {
            0.15: '#3B82F6', // Blue (Low)
            0.35: '#06B6D4', // Cyan
            0.55: '#10B981', // Emerald (Medium)
            0.75: '#F59E0B', // Amber (High)
            0.95: '#DC2626', // Bright Crimson (Critical / Dense Hotspot)
          },
        }).addTo(map);

        layerRef.current = heat;
      } catch (err) {
        console.error('Error creating heat layer:', err);
      }
    };

    initHeatmap();

    return () => {
      isMounted = false;
      if (layerRef.current && map) {
        try {
          map.removeLayer(layerRef.current);
        } catch {
          // Ignore
        }
        layerRef.current = null;
      }
    };
  }, [map, points, radius, blur, max, minOpacity]);

  return null;
};

const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

interface HeatmapViewProps {
  points: [number, number, number][];
  detailPoints?: HeatmapDetailPoint[];
  showPoints?: boolean;
  radius?: number;
  blur?: number;
  center?: [number, number];
  zoom?: number;
  height?: string;
}

export const HeatmapView: React.FC<HeatmapViewProps> = ({
  points,
  detailPoints = [],
  showPoints = false,
  radius = 35,
  blur = 22,
  center = [-6.2088, 106.8227],
  zoom = 12,
  height = '550px',
}) => {
  return (
    <div style={{ height }} className="w-full rounded-2xl overflow-hidden shadow-xs border border-slate-200 relative z-0">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} zoom={zoom} />
        <HeatmapLayer points={points} radius={radius} blur={blur} />

        {/* Optional point markers when admin wants to inspect exact locations */}
        {showPoints &&
          detailPoints.map((pt, idx) => (
            <CircleMarker
              key={pt.id || idx}
              center={[pt.lat, pt.lng]}
              radius={5}
              pathOptions={{
                color: pt.weight >= 0.8 ? '#DC2626' : pt.weight >= 0.5 ? '#F59E0B' : '#3B82F6',
                fillColor: pt.weight >= 0.8 ? '#EF4444' : pt.weight >= 0.5 ? '#FBBF24' : '#60A5FA',
                fillOpacity: 0.85,
                weight: 1.5,
              }}
            >
              <Tooltip direction="top" offset={[0, -5]}>
                <div className="text-xs p-1">
                  <p className="font-bold text-slate-800">{pt.title || 'Laporan Warga'}</p>
                  <p className="text-slate-500 text-[10px]">
                    {pt.category ? `${pt.category} • ` : ''}Prioritas: {pt.priority || 'Normal'}
                  </p>
                  <p className="text-teal-600 font-medium text-[10px] mt-0.5">
                    Bobot Intensitas: {Math.round(pt.weight * 100)}%
                  </p>
                </div>
              </Tooltip>
            </CircleMarker>
          ))}
      </MapContainer>

      {/* Heatmap Legend Overlay */}
      <div className="absolute bottom-4 right-4 z-1000 bg-white/95 backdrop-blur-xs p-3 rounded-2xl border border-slate-200 shadow-md text-xs space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <p className="font-bold text-slate-800">Konsentrasi Masalah</p>
          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md font-semibold">
            {points.length} Titik
          </span>
        </div>
        <div className="h-3 w-48 rounded-full bg-linear-to-r from-blue-500 via-cyan-400 via-emerald-500 via-amber-400 to-rose-600 shadow-inner" />
        <div className="flex justify-between text-[10px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Rendah
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Sedang
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 font-semibold text-rose-600"></span> Kritis / Hotspot
          </span>
        </div>
      </div>
    </div>
  );
};
