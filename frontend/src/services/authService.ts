import api from './api';
import { AuthResponse, RegisterOtpResponse, SecurityChallenge, User, VerifyOtpPayload } from '../types/auth';

export const authService = {
  async getSecurityChallenge(): Promise<SecurityChallenge> {
    const res = await api.get<SecurityChallenge>('/auth/security-challenge');
    return res.data;
  },

  async register(data: {
    name: string;
    email: string;
    phone: string;
    nik?: string;
    password: string;
    password_confirmation: string;
    security_token?: string;
    security_answer?: string | number;
    website_url?: string; // honeypot
  }): Promise<RegisterOtpResponse> {
    const res = await api.post<RegisterOtpResponse>('/auth/register', data);
    return res.data;
  },

  async verifyOtp(payload: VerifyOtpPayload): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/verify-otp', payload);
    if (res.data.token) {
      localStorage.setItem('wargalapor_token', res.data.token);
      localStorage.setItem('wargalapor_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async resendOtp(identifier: string, type: string = 'REGISTER'): Promise<{ message: string; channel?: string; demo_otp?: string; wait_seconds?: number }> {
    const res = await api.post('/auth/resend-otp', { identifier, type });
    return res.data;
  },

  async login(data: {
    email: string;
    password: string;
    security_token?: string;
    security_answer?: string | number;
    website_url?: string;
  }): Promise<AuthResponse | (RegisterOtpResponse & { requires_otp: true })> {
    const res = await api.post<AuthResponse | (RegisterOtpResponse & { requires_otp: true })>('/auth/login', data);
    if ('token' in res.data && res.data.token) {
      localStorage.setItem('wargalapor_token', res.data.token);
      localStorage.setItem('wargalapor_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await api.get<{ user: User }>('/auth/me');
    if (res.data.user) {
      localStorage.setItem('wargalapor_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async updateProfile(data: Partial<User> & { password?: string; password_confirmation?: string }): Promise<{ message: string; user: User }> {
    const res = await api.put<{ message: string; user: User }>('/auth/profile', data);
    if (res.data.user) {
      localStorage.setItem('wargalapor_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async logout(): Promise<{ message: string }> {
    try {
      const res = await api.post<{ message: string }>('/auth/logout');
      return res.data;
    } finally {
      localStorage.removeItem('wargalapor_token');
      localStorage.removeItem('wargalapor_user');
    }
  },

  async forgotPassword(email: string): Promise<{ message: string; demo_otp?: string }> {
    const res = await api.post<{ message: string; demo_otp?: string }>('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(data: { email: string; otp_code?: string; password: string; password_confirmation: string }): Promise<{ message: string }> {
    const res = await api.post<{ message: string }>('/auth/reset-password', data);
    return res.data;
  },
};
