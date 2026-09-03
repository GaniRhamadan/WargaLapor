import { useState } from 'react';

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  address: string;
  city: string;
  district: string;
  loading: boolean;
  error: string | null;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    latitude: -6.2088, // Default Jakarta Pusat
    longitude: 106.8227,
    address: 'Jl. Jenderal Sudirman, Jakarta Pusat',
    city: 'Jakarta Pusat',
    district: 'Dukuh Atas',
    loading: false,
    error: null,
  });

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'id-ID,id;q=0.9',
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        const addr = data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
        const city = data.address?.city || data.address?.town || data.address?.county || 'DKI Jakarta';
        const district = data.address?.suburb || data.address?.neighbourhood || '';
        return { address: addr, city, district };
      }
    } catch {
      // fallback
    }
    return {
      address: `Koordinat (${lat.toFixed(5)}, ${lon.toFixed(5)})`,
      city: 'DKI Jakarta',
      district: '',
    };
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Perangkat Anda tidak mendukung fitur deteksi lokasi GPS.',
        loading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const geoInfo = await reverseGeocode(lat, lon);
        setState({
          latitude: lat,
          longitude: lon,
          address: geoInfo.address,
          city: geoInfo.city,
          district: geoInfo.district,
          loading: false,
          error: null,
        });
      },
      (err) => {
        let errMsg = 'Gagal mendapatkan lokasi otomatis. Silakan tentukan lokasi pada peta secara manual.';
        if (err.code === err.PERMISSION_DENIED) {
          errMsg = 'Izin akses lokasi GPS ditolak oleh browser. Silakan aktifkan izin lokasi atau geser pin peta secara manual.';
        }
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errMsg,
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const setManualLocation = async (lat: number, lon: number) => {
    setState((prev) => ({ ...prev, loading: true }));
    const geoInfo = await reverseGeocode(lat, lon);
    setState({
      latitude: lat,
      longitude: lon,
      address: geoInfo.address,
      city: geoInfo.city,
      district: geoInfo.district,
      loading: false,
      error: null,
    });
  };

  return {
    ...state,
    getCurrentLocation,
    setManualLocation,
  };
};
