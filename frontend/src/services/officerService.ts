import api from './api';
import { supabase } from './supabase';
import { Report, ReportPriority, ReportStatus } from '../types/report';

export const officerService = {
  async getTasks(params?: {
    status?: string;
    priority?: string;
    page?: number;
  }): Promise<{ tasks: { data: Report[]; current_page: number; last_page: number; total: number }; stats: any }> {
    try {
      const res = await api.get('/officer/tasks', { params });
      return res.data;
    } catch {
      let query = supabase
        .from('reports')
        .select('*, category:report_categories(*), images:report_images(*)', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (params?.status) {
        query = query.eq('status', params.status);
      }
      if (params?.priority) {
        query = query.eq('priority', params.priority);
      }

      const { data, count, error } = await query;

      if (error) {
        console.error('Error fetching officer tasks from Supabase:', error);
      }

      const formattedTasks: Report[] = (data || []).map((r: any) => ({
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

      const activeCount = formattedTasks.filter((t) => t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS').length;
      const completedCount = formattedTasks.filter((t) => t.status === 'RESOLVED').length;

      return {
        tasks: {
          data: formattedTasks,
          current_page: 1,
          last_page: 1,
          total: count || formattedTasks.length,
        },
        stats: {
          active_tasks: activeCount,
          completed_tasks: completedCount,
          sla_warning: 0,
        },
      };
    }
  },

  async getTask(id: number | string): Promise<{ task: Report }> {
    try {
      const res = await api.get<{ task: Report }>(`/officer/tasks/${id}`);
      return res.data;
    } catch {
      const { data, error } = await supabase
        .from('reports')
        .select('*, category:report_categories(*), images:report_images(*), status_histories:report_status_histories(*)')
        .eq('id', id)
        .single();

      if (error || !data) throw new Error('Tugas tidak ditemukan');

      const task: Report = {
        id: data.id,
        report_number: data.report_number,
        user_id: data.user_id,
        category_id: data.category_id,
        title: data.title,
        description: data.description,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        address: data.address,
        province: data.province,
        city: data.city,
        district: data.district,
        subdistrict: data.subdistrict,
        priority: data.priority as ReportPriority,
        status: data.status as ReportStatus,
        verification_status: data.verification_status,
        sla_deadline: data.sla_deadline,
        is_overdue: data.is_overdue || false,
        verified_at: data.verified_at,
        resolved_at: data.resolved_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
        category: data.category,
        images: (data.images || []).map((img: any) => ({
          id: img.id,
          report_id: img.report_id,
          image_path: img.image_url,
          image_type: img.type || 'REPORT',
          caption: img.caption,
          created_at: img.created_at,
        })),
        status_histories: data.status_histories || [],
      };

      return { task };
    }
  },

  async updateStatus(
    id: number | string,
    data: {
      status: 'IN_PROGRESS' | 'WAITING' | 'RESOLVED';
      notes: string;
      resolution_proof_image?: string;
      progress_images?: string[];
    }
  ): Promise<{ message: string; report: Report }> {
    try {
      const res = await api.post<{ message: string; report: Report }>(`/officer/tasks/${id}/status`, data);
      return res.data;
    } catch {
      const updates: any = {
        status: data.status,
        updated_at: new Date().toISOString(),
      };
      if (data.status === 'RESOLVED') {
        updates.resolved_at = new Date().toISOString();
      }

      await supabase.from('reports').update(updates).eq('id', id);

      // Simpan riwayat perubahan status
      await supabase.from('report_status_histories').insert({
        report_id: id,
        new_status: data.status,
        notes: data.notes || `Petugas memperbarui status menjadi ${data.status}`,
      });

      // Simpan bukti penyelesaian jika ada
      if (data.resolution_proof_image) {
        await supabase.from('report_images').insert({
          report_id: id,
          image_url: data.resolution_proof_image,
          type: 'RESOLUTION',
          caption: 'Foto Bukti Penyelesaian Pekerjaan Lapangan',
        });
      }

      return {
        message: `Status laporan berhasil diperbarui menjadi ${data.status}`,
        report: { id: Number(id), status: data.status } as any,
      };
    }
  },
};
