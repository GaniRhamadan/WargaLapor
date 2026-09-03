import api from './api';
import { Report } from '../types/report';

export const officerService = {
  async getTasks(params?: {
    status?: string;
    priority?: string;
    page?: number;
  }): Promise<{ tasks: { data: Report[]; current_page: number; last_page: number; total: number }; stats: any }> {
    const res = await api.get('/officer/tasks', { params });
    return res.data;
  },

  async getTask(id: number | string): Promise<{ task: Report }> {
    const res = await api.get<{ task: Report }>(`/officer/tasks/${id}`);
    return res.data;
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
    const res = await api.post<{ message: string; report: Report }>(`/officer/tasks/${id}/status`, data);
    return res.data;
  },
};
