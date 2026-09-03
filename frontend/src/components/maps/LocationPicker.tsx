import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '../common/Button';
import { Crosshair, MapPin, Navigation } from 'lucide-react';

const pickerIcon = L.divIcon({
  className: 'leaflet-custom-marker',
  html: `
    <div class="w-10 h-10 rounded-full bg-rose-600 border-4 border-white shadow-xl flex items-center justify-center text-white transform -translate-y-3 animate-bounce">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 2a8 8 0 00-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 00-8-8z"></path>
        <circle cx="12" cy="10" r="3" fill="currentColor"></circle>
      </svg>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const MapEventsHandler: React.FC<{ onLocationChange: (lat: number, lng: number) => void }> = ({
  onLocationChange,
}) => {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const MapCenterUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
  onUseGps: () => void;
  isGpsLoading?: boolean;
  height?: string;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  onLocationChange,
  onUseGps,
  isGpsLoading = false,
  height = '350px',
}) => {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xs z-0" style={{ height }}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapCenterUpdater center={[latitude, longitude]} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEventsHandler onLocationChange={onLocationChange} />
        <Marker
          position={[latitude, longitude]}
          draggable={true}
          icon={pickerIcon}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const pos = marker.getLatLng();
              onLocationChange(pos.lat, pos.lng);
            },
          }}
        />
      </MapContainer>

      {/* GPS Location Trigger floating button */}
      <div className="absolute top-4 right-4 z-1000">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          isLoading={isGpsLoading}
          onClick={onUseGps}
          leftIcon={<Navigation className="w-4 h-4 text-teal-400" />}
          className="shadow-lg bg-slate-900/90 backdrop-blur-xs text-xs font-semibold"
        >
          Gunakan Lokasi Saya (GPS)
        </Button>
      </div>

      {/* Coordinate HUD Helper */}
      <div className="absolute bottom-3 left-3 z-1000 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] font-medium text-slate-600 shadow-xs flex items-center gap-1.5">
        <Crosshair className="w-3.5 h-3.5 text-teal-600" />
        <span>
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </span>
        <span className="text-[10px] text-slate-400 ml-1">(Klik/Geser pin untuk ubah titik)</span>
      </div>
    </div>
  );
};
