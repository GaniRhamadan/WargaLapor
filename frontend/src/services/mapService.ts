import api from './api';
import { Report } from '../types/report';

export interface HeatmapDetailPoint {
  id: number;
  lat: number;
  lng: number;
  weight: number;
  title: string;
  category: string;
  priority: string;
  status: string;
  address?: string;
}

export interface HotspotCluster {
  name: string;
  count: number;
  critical_count: number;
  top_category: string;
  level: 'KRITIS' | 'TINGGI' | 'SEDANG';
  lat: number;
  lng: number;
}

export interface HeatmapResponse {
  points: [number, number, number][];
  detail_points?: HeatmapDetailPoint[];
  stats?: {
    total: number;
    critical_count: number;
    high_count: number;
    active_count: number;
  };
  hotspots?: HotspotCluster[];
}

export const mapService = {
  async getMapReports(params?: {
    category_id?: number;
    status?: string;
    priority?: string;
    city?: string;
  }): Promise<{ reports: Report[] }> {
    const res = await api.get<{ reports: Report[] }>('/map/reports', { params });
    return res.data;
  },

  async getHeatmapPoints(params?: {
    category_id?: number;
    status?: string;
    priority?: string;
  }): Promise<HeatmapResponse> {
    const res = await api.get<HeatmapResponse>('/map/heatmap', { params });
    return res.data;
  },
};
