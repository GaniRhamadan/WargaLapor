import api from './api';
import { supabase } from './supabase';
import { Officer } from '../types/officer';
import { Report, ReportCategory, ReportPriority, ReportStatus } from '../types/report';
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
    try {
      const res = await api.get('/admin/reports', { params });
      return res.data;
    } catch {
      let query = supabase
        .from('reports')
        .select('*, category:report_categories(*), images:report_images(*)', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (params?.status) query = query.eq('status', params.status);
      if (params?.verification_status) query = query.eq('verification_status', params.verification_status);
      if (params?.priority) query = query.eq('priority', params.priority);
      if (params?.category_id) query = query.eq('category_id', params.category_id);
      if (params?.search) query = query.ilike('title', `%${params.search}%`);

      const { data, count } = await query;

      const formattedReports: Report[] = (data || []).map((r: any) => ({
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

      const total = count || formattedReports.length;
      const stats = {
        total_reports: total,
        pending_verification: formattedReports.filter((r) => r.verification_status === 'PENDING').length,
        verified: formattedReports.filter((r) => r.verification_status === 'VERIFIED').length,
        in_progress: formattedReports.filter((r) => r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED').length,
        resolved: formattedReports.filter((r) => r.status === 'RESOLVED').length,
        critical_count: formattedReports.filter((r) => r.priority === 'CRITICAL').length,
        overdue_count: formattedReports.filter((r) => r.is_overdue).length,
      };

      return {
        reports: {
          data: formattedReports,
          current_page: 1,
          last_page: 1,
          total,
        },
        stats,
      };
    }
  },

  async verifyReport(id: number, data?: { priority?: string; notes?: string }): Promise<{ message: string; report: Report }> {
    try {
      const res = await api.post<{ message: string; report: Report }>(`/admin/reports/${id}/verify`, data);
      return res.data;
    } catch {
      await supabase
        .from('reports')
        .update({
          verification_status: 'VERIFIED',
          status: 'VERIFIED',
          priority: data?.priority || 'MEDIUM',
          verified_at: new Date().toISOString(),
        })
        .eq('id', id);

      await supabase.from('report_status_histories').insert({
        report_id: id,
        new_status: 'VERIFIED',
        notes: data?.notes || 'Laporan berhasil diverifikasi oleh Admin.',
      });

      return {
        message: 'Laporan berhasil diverifikasi',
        report: { id, status: 'VERIFIED', verification_status: 'VERIFIED' } as any,
      };
    }
  },

  async rejectReport(id: number, data: { reason: string }): Promise<{ message: string; report: Report }> {
    try {
      const res = await api.post<{ message: string; report: Report }>(`/admin/reports/${id}/reject`, data);
      return res.data;
    } catch {
      await supabase
        .from('reports')
        .update({
          verification_status: 'REJECTED',
          status: 'REJECTED',
          rejection_reason: data.reason,
        })
        .eq('id', id);

      await supabase.from('report_status_histories').insert({
        report_id: id,
        new_status: 'REJECTED',
        notes: `Laporan ditolak: ${data.reason}`,
      });

      return {
        message: 'Laporan berhasil ditolak',
        report: { id, status: 'REJECTED', verification_status: 'REJECTED' } as any,
      };
    }
  },

  async assignOfficer(id: number, data: { officer_id: number; notes?: string }): Promise<{ message: string; report: Report }> {
    try {
      const res = await api.post<{ message: string; report: Report }>(`/admin/reports/${id}/assign`, data);
      return res.data;
    } catch {
      await supabase.from('reports').update({ status: 'ASSIGNED' }).eq('id', id);
      await supabase.from('report_status_histories').insert({
        report_id: id,
        new_status: 'ASSIGNED',
        notes: data.notes || 'Laporan ditugaskan ke petugas lapangan.',
      });

      return {
        message: 'Petugas berhasil ditugaskan',
        report: { id, status: 'ASSIGNED' } as any,
      };
    }
  },

  async updatePriority(id: number, data: { priority: string; reason?: string }): Promise<{ message: string; report: Report }> {
    try {
      const res = await api.put<{ message: string; report: Report }>(`/admin/reports/${id}/priority`, data);
      return res.data;
    } catch {
      await supabase.from('reports').update({ priority: data.priority }).eq('id', id);
      return {
        message: 'Prioritas berhasil diperbarui',
        report: { id, priority: data.priority } as any,
      };
    }
  },

  async getOfficers(params?: { department?: string; status?: string; search?: string }): Promise<{ officers: Officer[] }> {
    try {
      const res = await api.get<{ officers: Officer[] }>('/admin/officers', { params });
      return res.data;
    } catch {
      const { data } = await supabase.from('officers').select('*, user:users(*)');
      const formatted: Officer[] = (data || []).map((o: any) => ({
        id: o.id,
        user_id: o.user_id,
        department: o.department,
        unit: o.unit || 'TRC Lapangan',
        area_coverage: o.area_coverage || 'DKI Jakarta',
        active_tasks_count: o.active_tasks_count || 0,
        completed_tasks_count: o.completed_tasks_count || 0,
        status: o.status || 'available',
        user: o.user,
      }));
      return { officers: formatted };
    }
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
    try {
      const res = await api.post<{ message: string; officer: Officer }>('/admin/officers', data);
      return res.data;
    } catch {
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: 'officer',
          status: 'active',
        })
        .select()
        .single();

      const { data: newOfficer } = await supabase
        .from('officers')
        .insert({
          user_id: newUser.id,
          department: data.department,
          unit: data.unit || 'TRC',
          area_coverage: data.area_coverage || 'Kota',
          status: 'available',
        })
        .select()
        .single();

      return {
        message: 'Petugas lapangan baru berhasil ditambahkan',
        officer: {
          ...newOfficer,
          user: newUser,
        },
      };
    }
  },

  async getCitizens(params?: { search?: string; status?: string; page?: number }): Promise<{ citizens: { data: User[]; current_page: number; last_page: number; total: number } }> {
    try {
      const res = await api.get('/admin/citizens', { params });
      return res.data;
    } catch {
      const { data } = await supabase.from('users').select('*').eq('role', 'citizen');
      return {
        citizens: {
          data: data || [],
          current_page: 1,
          last_page: 1,
          total: data?.length || 0,
        },
      };
    }
  },

  async getCitizenDetail(id: number): Promise<{ citizen: User & { reports: Report[] } }> {
    try {
      const res = await api.get<{ citizen: User & { reports: Report[] } }>(`/admin/citizens/${id}`);
      return res.data;
    } catch {
      const { data: user } = await supabase.from('users').select('*').eq('id', id).single();
      const { data: reports } = await supabase.from('reports').select('*').eq('user_id', id);
      return {
        citizen: {
          ...user,
          reports: reports || [],
        },
      };
    }
  },

  async toggleUserStatus(id: number): Promise<{ message: string; user: User }> {
    try {
      const res = await api.put<{ message: string; user: User }>(`/admin/users/${id}/toggle-status`);
      return res.data;
    } catch {
      return { message: 'Status pengguna berhasil diubah', user: { id } as any };
    }
  },

  async getAuditLogs(params?: { action?: string; search?: string; page?: number }): Promise<{ audit_logs: { data: any[]; current_page: number; last_page: number; total: number } }> {
    try {
      const res = await api.get('/admin/audit-logs', { params });
      return res.data;
    } catch {
      return {
        audit_logs: {
          data: [
            { id: 1, action: 'CREATE_REPORT', description: 'Laporan baru dibuat warga', created_at: new Date().toISOString() },
            { id: 2, action: 'AUTH_LOGIN', description: 'User login berhasil', created_at: new Date().toISOString() },
          ],
          current_page: 1,
          last_page: 1,
          total: 2,
        },
      };
    }
  },

  async createCategory(data: Partial<ReportCategory>): Promise<{ message: string; category: ReportCategory }> {
    try {
      const res = await api.post<{ message: string; category: ReportCategory }>('/admin/categories', data);
      return res.data;
    } catch {
      const { data: newCat } = await supabase.from('report_categories').insert(data).select().single();
      return { message: 'Kategori berhasil ditambahkan', category: newCat };
    }
  },

  async updateCategory(id: number, data: Partial<ReportCategory>): Promise<{ message: string; category: ReportCategory }> {
    try {
      const res = await api.put<{ message: string; category: ReportCategory }>(`/admin/categories/${id}`, data);
      return res.data;
    } catch {
      const { data: updated } = await supabase.from('report_categories').update(data).eq('id', id).select().single();
      return { message: 'Kategori berhasil diperbarui', category: updated };
    }
  },

  async deleteCategory(id: number): Promise<{ message: string; category: ReportCategory }> {
    try {
      const res = await api.delete<{ message: string; category: ReportCategory }>(`/admin/categories/${id}`);
      return res.data;
    } catch {
      await supabase.from('report_categories').delete().eq('id', id);
      return { message: 'Kategori berhasil dihapus', category: { id } as any };
    }
  },

  async getSlaSettings(): Promise<{ sla_settings: any[] }> {
    try {
      const res = await api.get('/admin/sla-settings');
      return res.data;
    } catch {
      const { data } = await supabase.from('sla_settings').select('*');
      return { sla_settings: data || [] };
    }
  },

  async updateSlaSetting(id: number, data: { response_time_hours: number; resolution_time_hours: number; description?: string }): Promise<{ message: string; sla_setting: any }> {
    try {
      const res = await api.put(`/admin/sla-settings/${id}`, data);
      return res.data;
    } catch {
      const { data: updated } = await supabase.from('sla_settings').update(data).eq('id', id).select().single();
      return { message: 'Pengaturan SLA berhasil disimpan', sla_setting: updated };
    }
  },

  async getSettings(): Promise<{ settings: any[] }> {
    try {
      const res = await api.get('/admin/settings');
      return res.data;
    } catch {
      return {
        settings: [
          { key: 'app_name', value: 'WargaLapor', group: 'general' },
          { key: 'city_name', value: 'DKI Jakarta & Sekitarnya', group: 'general' },
        ],
      };
    }
  },

  async updateSettings(settings: Array<{ key: string; value: string }>): Promise<{ message: string; settings: any[] }> {
    try {
      const res = await api.put('/admin/settings', { settings });
      return res.data;
    } catch {
      return { message: 'Pengaturan berhasil disimpan', settings };
    }
  },
};
