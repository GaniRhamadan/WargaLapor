import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Report } from '../../types/report';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { Link } from 'react-router-dom';
import { MapPin, Navigation } from 'lucide-react';

// Fix Leaflet default marker icon paths in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom Category SVG Marker Builder
const createCustomIcon = (color: string, isCritical = false) => {
  return L.divIcon({
    className: 'leaflet-custom-marker',
    html: `
      <div class="relative flex items-center justify-center">
        ${isCritical ? '<div class="absolute w-8 h-8 rounded-full bg-rose-500/40 animate-ping"></div>' : ''}
        <div style="background-color: ${color};" class="w-8 h-8 rounded-2xl border-2 border-white shadow-lg flex items-center justify-center text-white transform -translate-y-2 hover:scale-110 transition-transform">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const ChangeMapView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

interface ReportMapProps {
  reports: Report[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onMarkerClick?: (report: Report) => void;
  showLinkToDetail?: boolean;
}

export const ReportMap: React.FC<ReportMapProps> = ({
  reports,
  center = [-6.2088, 106.8227],
  zoom = 12,
  height = '500px',
  onMarkerClick,
  showLinkToDetail = true,
}) => {
  // Ensure safe reports array and valid coordinates
  const validReports = Array.isArray(reports)
    ? reports.filter(
        (r) =>
          r &&
          r.latitude != null &&
          r.longitude != null &&
          !isNaN(Number(r.latitude)) &&
          !isNaN(Number(r.longitude)) &&
          Number(r.latitude) !== 0 &&
          Number(r.longitude) !== 0
      )
    : [];

  return (
    <div style={{ height }} className="w-full rounded-2xl overflow-hidden shadow-xs border border-slate-200 relative z-0">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="w-full h-full">
        <ChangeMapView center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> kontributor'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validReports.map((report) => {
          const isCrit = report.priority === 'CRITICAL';
          const markerColor = report.category?.color || (isCrit ? '#DC2626' : '#0D9488');
          const icon = createCustomIcon(markerColor, isCrit);

          return (
            <Marker
              key={report.id}
              position={[Number(report.latitude), Number(report.longitude)]}
              icon={icon}
              eventHandlers={{
                click: () => onMarkerClick && onMarkerClick(report),
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 space-y-2 max-w-xs text-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-400">
                      {report.report_number}
                    </span>
                    <PriorityBadge priority={report.priority} size="sm" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {report.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{report.description}</p>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-teal-600" />
                    <span className="truncate">{report.address}</span>
                  </div>
                  <div className="pt-1.5 flex items-center justify-between border-t border-slate-100">
                    <StatusBadge status={report.status} size="sm" />
                    {showLinkToDetail && (
                      <Link
                        to={`/citizen/reports/${report.id}`}
                        className="text-xs font-semibold text-teal-600 hover:text-teal-700 underline"
                      >
                        Lihat Detail →
                      </Link>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
