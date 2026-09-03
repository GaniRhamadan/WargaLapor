import api from './api';
import { Officer } from '../types/officer';
import { Report, ReportCategory } from '../types/report';
import { User } from '../types/auth';

export const adminService = {
  async getReports(params?: {
    status?: string;
    verification_status?: string;
    priority?: string;
    category_id?: number;
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ reports: { data: Report[]; current_page: number; last_page: number; total: number }; stats: any }> {
    const res = await api.get('/admin/reports', { params });
    return res.data;
  },

  async verifyReport(id: number, data?: { priority?: string; notes?: string }): Promise<{ message: string; report: Report }> {
    const res = await api.post<{ message: string; report: Report }>(`/admin/reports/${id}/verify`, data);
    return res.data;
  },

  async rejectReport(id: number, data: { reason: string }): Promise<{ message: string; report: Report }> {
    const res = await api.post<{ message: string; report: Report }>(`/admin/reports/${id}/reject`, data);
    return res.data;
  },

  async assignOfficer(id: number, data: { officer_id: number; notes?: string }): Promise<{ message: string; report: Report }> {
    const res = await api.post<{ message: string; report: Report }>(`/admin/reports/${id}/assign`, data);
    return res.data;
  },

  async updatePriority(id: number, data: { priority: string; reason?: string }): Promise<{ message: string; report: Report }> {
    const res = await api.put<{ message: string; report: Report }>(`/admin/reports/${id}/priority`, data);
    return res.data;
  },

  async getOfficers(params?: { department?: string; status?: string; search?: string }): Promise<{ officers: Officer[] }> {
    const res = await api.get<{ officers: Officer[] }>('/admin/officers', { params });
    return res.data;
  },

  async createOfficer(data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    department: string;
    unit?: string;
    area_coverage?: string;
  }): Promise<{ message: string; officer: Officer }> {
    const res = await api.post<{ message: string; officer: Officer }>('/admin/officers', data);
    return res.data;
  },

  async getCitizens(params?: { search?: string; status?: string; page?: number }): Promise<{ citizens: { data: User[]; current_page: number; last_page: number; total: number } }> {
    const res = await api.get('/admin/citizens', { params });
    return res.data;
  },

  async getCitizenDetail(id: number): Promise<{ citizen: User & { reports: Report[] } }> {
    const res = await api.get<{ citizen: User & { reports: Report[] } }>(`/admin/citizens/${id}`);
    return res.data;
  },

  async toggleUserStatus(id: number): Promise<{ message: string; user: User }> {
    const res = await api.put<{ message: string; user: User }>(`/admin/users/${id}/toggle-status`);
    return res.data;
  },

  async getAuditLogs(params?: { action?: string; search?: string; page?: number }): Promise<{ audit_logs: { data: any[]; current_page: number; last_page: number; total: number } }> {
    const res = await api.get('/admin/audit-logs', { params });
    return res.data;
  },

  async createCategory(data: Partial<ReportCategory>): Promise<{ message: string; category: ReportCategory }> {
    const res = await api.post<{ message: string; category: ReportCategory }>('/admin/categories', data);
    return res.data;
  },

  async updateCategory(id: number, data: Partial<ReportCategory>): Promise<{ message: string; category: ReportCategory }> {
    const res = await api.put<{ message: string; category: ReportCategory }>(`/admin/categories/${id}`, data);
    return res.data;
  },

  async deleteCategory(id: number): Promise<{ message: string; category: ReportCategory }> {
    const res = await api.delete<{ message: string; category: ReportCategory }>(`/admin/categories/${id}`);
    return res.data;
  },

  async getSlaSettings(): Promise<{ sla_settings: any[] }> {
    const res = await api.get('/admin/sla-settings');
    return res.data;
  },

  async updateSlaSetting(id: number, data: { response_time_hours: number; resolution_time_hours: number; description?: string }): Promise<{ message: string; sla_setting: any }> {
    const res = await api.put(`/admin/sla-settings/${id}`, data);
    return res.data;
  },

  async getSettings(): Promise<{ settings: any[] }> {
    const res = await api.get('/admin/settings');
    return res.data;
  },

  async updateSettings(settings: Array<{ key: string; value: string }>): Promise<{ message: string; settings: any[] }> {
    const res = await api.put('/admin/settings', { settings });
    return res.data;
  },
};
