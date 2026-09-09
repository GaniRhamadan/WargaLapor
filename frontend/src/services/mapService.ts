import api from './api';
import { supabase } from './supabase';
import { Report, ReportPriority, ReportStatus } from '../types/report';

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
    try {
      const res = await api.get<{ reports: Report[] }>('/map/reports', { params });
      return res.data;
    } catch {
      let query = supabase.from('reports').select('*, category:report_categories(*), images:report_images(*)');

      if (params?.status) query = query.eq('status', params.status);
      if (params?.priority) query = query.eq('priority', params.priority);
      if (params?.category_id) query = query.eq('category_id', params.category_id);

      const { data } = await query;

      const formatted: Report[] = (data || []).map((r: any) => ({
        id: r.id,
        report_number: r.report_number,
        user_id: r.user_id,
        category_id: r.category_id,
        title: r.title,
        description: r.description,
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
        address: r.address,
        province: r.province,
        city: r.city,
        district: r.district,
        subdistrict: r.subdistrict,
        priority: r.priority as ReportPriority,
        status: r.status as ReportStatus,
        verification_status: r.verification_status || 'PENDING',
        rejection_reason: r.rejection_reason,
        sla_deadline: r.sla_deadline,
        is_overdue: r.is_overdue || false,
        verified_at: r.verified_at,
        resolved_at: r.resolved_at,
        created_at: r.created_at,
        updated_at: r.updated_at,
        category: r.category,
        images: (r.images || []).map((img: any) => ({
          id: img.id,
          report_id: img.report_id,
          image_path: img.image_url,
          image_type: img.type || 'REPORT',
          caption: img.caption,
          created_at: img.created_at,
        })),
      }));

      return { reports: formatted };
    }
  },

  async getHeatmapPoints(params?: {
    category_id?: number;
    status?: string;
    priority?: string;
  }): Promise<HeatmapResponse> {
    try {
      const res = await api.get<HeatmapResponse>('/map/heatmap', { params });
      return res.data;
    } catch {
      const { reports } = await this.getMapReports(params);

      const points: [number, number, number][] = [];
      const detailPoints: HeatmapDetailPoint[] = [];

      let criticalCount = 0;
      let highCount = 0;
      let activeCount = 0;

      for (const r of reports) {
        let weight = 0.5;
        if (r.priority === 'CRITICAL') {
          weight = 1.0;
          criticalCount++;
        } else if (r.priority === 'HIGH') {
          weight = 0.8;
          highCount++;
        } else if (r.priority === 'LOW') {
          weight = 0.3;
        }

        if (r.status !== 'RESOLVED' && r.status !== 'CLOSED' && r.status !== 'REJECTED') {
          activeCount++;
        }

        points.push([r.latitude, r.longitude, weight]);
        detailPoints.push({
          id: r.id,
          lat: r.latitude,
          lng: r.longitude,
          weight,
          title: r.title,
          category: r.category?.name || 'Umum',
          priority: r.priority,
          status: r.status,
          address: r.address,
        });
      }

      return {
        points,
        detail_points: detailPoints,
        stats: {
          total: reports.length,
          critical_count: criticalCount,
          high_count: highCount,
          active_count: activeCount,
        },
        hotspots: [
          {
            name: 'Pusat Kota',
            count: reports.length,
            critical_count: criticalCount,
            top_category: reports[0]?.category?.name || 'Infrastruktur',
            level: criticalCount > 0 ? 'KRITIS' : 'SEDANG',
            lat: reports[0]?.latitude || -6.2,
            lng: reports[0]?.longitude || 106.8,
          },
        ],
      };
    }
  },
};
