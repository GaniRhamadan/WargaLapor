import api from './api';
import { Notification } from '../types/notification';

export const notificationService = {
  async getNotifications(page = 1): Promise<{ notifications: { data: Notification[]; current_page: number; last_page: number; total: number }; unread_count: number }> {
    const res = await api.get('/notifications', { params: { page } });
    return res.data;
  },

  async markAsRead(id: number): Promise<{ message: string; notification: Notification }> {
    const res = await api.put<{ message: string; notification: Notification }>(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllAsRead(): Promise<{ message: string }> {
    const res = await api.put<{ message: string }>('/notifications/read-all');
    return res.data;
  },
};
