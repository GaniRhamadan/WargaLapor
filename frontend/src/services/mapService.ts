import api from './api';
import { Report } from '../types/report';

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

  async getHeatmapPoints(): Promise<{ points: [number, number, number][] }> {
    const res = await api.get<{ points: [number, number, number][] }>('/map/heatmap');
    return res.data;
  },
};
