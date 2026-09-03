import api from './api';
import {
  AiAnalysis,
  DuplicateCheckResult,
  Report,
  ReportCategory,
  ReportComment,
  ReportFeedback,
} from '../types/report';

export interface CreateReportPayload {
  category_id: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  province?: string;
  city?: string;
  district?: string;
  subdistrict?: string;
  images?: string[];
  user_action?: 'PROCEEDED' | 'MERGED';
  merged_into_id?: number;
}

export const reportService = {
  async getCategories(): Promise<{ categories: ReportCategory[] }> {
    const res = await api.get<{ categories: ReportCategory[] }>('/categories');
    return res.data;
  },

  async getReports(params?: {
    scope?: 'my' | 'public';
    status?: string;
    priority?: string;
    category_id?: number;
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ data: Report[]; current_page: number; last_page: number; total: number }> {
    const res = await api.get('/reports', { params });
    return res.data;
  },

  async getReport(id: number | string): Promise<{ report: Report }> {
    const res = await api.get<{ report: Report }>(`/reports/${id}`);
    return res.data;
  },

  async createReport(payload: CreateReportPayload): Promise<{ message: string; report: Report }> {
    const res = await api.post<{ message: string; report: Report }>('/reports', payload);
    return res.data;
  },

  async analyzeAi(data: { title: string; description: string; category_id?: number }): Promise<{ analysis: AiAnalysis }> {
    const res = await api.post<{ analysis: AiAnalysis }>('/reports/analyze-ai', data);
    return res.data;
  },

  async checkDuplicates(data: {
    latitude: number;
    longitude: number;
    category_id: number;
    title: string;
    description: string;
  }): Promise<DuplicateCheckResult> {
    const res = await api.post<DuplicateCheckResult>('/reports/check-duplicate', data);
    return res.data;
  },

  async addComment(reportId: number, data: { comment: string; is_internal?: boolean }): Promise<{ message: string; comment: ReportComment }> {
    const res = await api.post<{ message: string; comment: ReportComment }>(`/reports/${reportId}/comments`, data);
    return res.data;
  },

  async addFeedback(reportId: number, data: { rating: number; comments?: string }): Promise<{ message: string; feedback: ReportFeedback }> {
    const res = await api.post<{ message: string; feedback: ReportFeedback }>(`/reports/${reportId}/feedback`, data);
    return res.data;
  },
};
