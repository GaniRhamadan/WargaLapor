import api from './api';

export const analyticsService = {
  async getPublicStats(): Promise<{
    total_reports: number;
    resolved_reports: number;
    in_progress_reports: number;
    officers_count: number;
    citizens_count: number;
    average_satisfaction: number;
    resolution_rate: number;
  }> {
    const res = await api.get('/public/stats');
    return res.data;
  },

  async getAdminAnalytics(days = 30): Promise<{
    metrics: {
      total_reports: number;
      resolved_reports: number;
      overdue_reports: number;
      resolution_rate: number;
      average_satisfaction: number;
      average_resolution_hours: number;
    };
    daily_trends: Array<{ date: string; laporan_masuk: number; laporan_selesai: number }>;
    category_distribution: Array<{ name: string; count: number; color: string }>;
    status_distribution: Array<{ name: string; value: number; color: string }>;
    priority_distribution: Array<{ name: string; value: number; color: string }>;
    top_officers: any[];
  }> {
    const res = await api.get('/admin/analytics', { params: { days } });
    return res.data;
  },
};
