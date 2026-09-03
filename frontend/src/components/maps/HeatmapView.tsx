import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

const HeatmapLayer: React.FC<{ points: [number, number, number][] }> = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;

    // Create heat layer with vibrant intensity gradient
    const heat = (L as any).heatLayer(points, {
      radius: 28,
      blur: 20,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.2: '#3B82F6', // Blue
        0.4: '#06B6D4', // Cyan
        0.6: '#10B981', // Emerald
        0.8: '#F59E0B', // Amber
        1.0: '#DC2626', // Red
      },
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);

  return null;
};

interface HeatmapViewProps {
  points: [number, number, number][];
  center?: [number, number];
  zoom?: number;
  height?: string;
}

export const HeatmapView: React.FC<HeatmapViewProps> = ({
  points,
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
        <HeatmapLayer points={points} />
      </MapContainer>

      {/* Heatmap Legend Overlay */}
      <div className="absolute bottom-4 right-4 z-1000 bg-white/95 backdrop-blur-xs p-3 rounded-2xl border border-slate-200 shadow-md text-xs space-y-1.5">
        <p className="font-bold text-slate-800">Konsentrasi Laporan</p>
        <div className="h-3 w-40 rounded-full bg-linear-to-r from-blue-500 via-emerald-500 via-amber-400 to-rose-600" />
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>Rendah</span>
          <span>Sedang</span>
          <span>Kritis / Padat</span>
        </div>
      </div>
    </div>
  );
};
