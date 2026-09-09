import api from './api';
import { supabase } from './supabase';
import {
  AuthResponse,
  RegisterOtpResponse,
  SecurityChallenge,
  User,
  UserRole,
  UserStatus,
  VerifyOtpPayload,
} from '../types/auth';

export const authService = {
  async getSecurityChallenge(): Promise<SecurityChallenge> {
    try {
      const res = await api.get<SecurityChallenge>('/auth/security-challenge');
      return res.data;
    } catch {
      const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
      let code = '';
      for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
      return {
        token: 'local_' + btoa(code),
        captcha_image: '',
        expires_in_seconds: 300,
        question: 'Ketik 5 karakter kode anti-bot',
      };
    }
  },

  async login(data: {
    email: string;
    password: string;
    security_token?: string;
    security_answer?: string | number;
    website_url?: string;
  }): Promise<AuthResponse | (RegisterOtpResponse & { requires_otp: true })> {
    try {
      const res = await api.post<AuthResponse | (RegisterOtpResponse & { requires_otp: true })>(
        '/auth/login',
        data
      );

      // Jika akun butuh aktivasi OTP (belum diverifikasi)
      if ('requires_otp' in res.data && res.data.requires_otp) {
        return res.data;
      }

      // Jika login berhasil & mendapatkan token resmi Sanctum
      if ('token' in res.data && res.data.token) {
        localStorage.setItem('wargalapor_token', res.data.token);
        localStorage.setItem('wargalapor_user', JSON.stringify(res.data.user));
      }

      return res.data;
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.email?.[0] ||
        err.message ||
        'Gagal masuk ke akun. Periksa kembali email/kata sandi Anda.';
      throw new Error(msg);
    }
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
    website_url?: string;
  }): Promise<RegisterOtpResponse> {
    try {
      // Panggil backend Laravel resmi yang terhubung ke Gmail SMTP (parabu12siliwangi@gmail.com)
      const res = await api.post<RegisterOtpResponse>('/auth/register', data);

      // JANGAN PERNAH SIMPAN TOKEN KE LOCALSTORAGE DI SINI!
      // Pengguna WAJIB memverifikasi kode OTP 6-digit terlebih dahulu.
      localStorage.removeItem('wargalapor_token');
      localStorage.removeItem('wargalapor_user');

      // Sync data profil sementara ke Supabase jika tersedia
      try {
        await supabase.from('users').upsert(
          {
            name: data.name,
            email: data.email.toLowerCase().trim(),
            phone: data.phone,
            nik: data.nik || null,
            role: 'citizen',
            status: 'pending_verification',
          },
          { onConflict: 'email' }
        );
      } catch (sbErr) {
        console.warn('Supabase sync skipped:', sbErr);
      }

      return res.data;
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.errors?.phone?.[0] ||
        err.response?.data?.errors?.name?.[0] ||
        err.message ||
        'Pendaftaran gagal. Silakan periksa kembali isian formulir.';
      throw new Error(msg);
    }
  },

  async verifyOtp(payload: VerifyOtpPayload): Promise<AuthResponse> {
    const cleanToken = payload.otp_code.trim();

    if (!cleanToken || cleanToken.length !== 6) {
      throw new Error('Harap masukkan 6 digit kode OTP yang sesuai dari email aktif Anda.');
    }

    try {
      // Verifikasi KETAT melalui Backend Laravel yang memvalidasi ke tabel otp_verifications
      const res = await api.post<AuthResponse>('/auth/verify-otp', {
        identifier: payload.identifier.toLowerCase().trim(),
        otp_code: cleanToken,
        type: payload.type || 'REGISTER',
      });

      if (!res.data.token || !res.data.user) {
        throw new Error('Verifikasi OTP gagal. Tanggapan server tidak valid.');
      }

      // Simpan session login setelah berhasil diverifikasi secara sah
      localStorage.setItem('wargalapor_token', res.data.token);
      localStorage.setItem('wargalapor_user', JSON.stringify(res.data.user));

      // Sync status aktif ke Supabase jika ada
      try {
        await supabase
          .from('users')
          .update({ status: 'active' })
          .eq('email', payload.identifier.toLowerCase().trim());
      } catch (sbErr) {
        console.warn('Supabase user status update skipped:', sbErr);
      }

      return res.data;
    } catch (err: any) {
      // TOLAK TEGAS: Jangan biarkan masuk jika kode salah / kedaluwarsa / sembarangan!
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.errors?.otp_code?.[0] ||
        err.message ||
        'Kode OTP tidak valid atau salah. Harap periksa email Anda.';
      throw new Error(errorMsg);
    }
  },

  async resendOtp(
    identifier: string,
    type: string = 'REGISTER'
  ): Promise<{ message: string; channel?: string; wait_seconds?: number }> {
    try {
      const res = await api.post<{ message: string; channel?: string; wait_seconds?: number }>(
        '/auth/resend-otp',
        {
          identifier: identifier.toLowerCase().trim(),
          type,
        }
      );
      return res.data;
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Gagal mengirim ulang kode OTP. Silakan tunggu beberapa saat.';
      throw new Error(msg);
    }
  },

  async getMe(): Promise<{ user: User }> {
    try {
      const res = await api.get<{ user: User }>('/auth/me');
      if (res.data?.user) {
        localStorage.setItem('wargalapor_user', JSON.stringify(res.data.user));
        return res.data;
      }
    } catch {
      // Backend not reached or offline: check Supabase session
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const email = sessionData?.session?.user?.email;
        if (email) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('*, officers(*)')
            .eq('email', email)
            .maybeSingle();

          if (userProfile) {
            const userObj: User = {
              id: userProfile.id,
              name: userProfile.name,
              email: userProfile.email,
              phone: userProfile.phone,
              nik: userProfile.nik,
              role: userProfile.role as UserRole,
              avatar: userProfile.avatar,
              status: userProfile.status as UserStatus,
              officer_profile: userProfile.officers?.[0] || null,
            };
            localStorage.setItem('wargalapor_user', JSON.stringify(userObj));
            return { user: userObj };
          }
        }
      } catch (sbErr) {
        console.warn('Supabase getMe skipped:', sbErr);
      }

      // Fallback to locally saved user in localStorage
      const saved = localStorage.getItem('wargalapor_user');
      if (saved) {
        try {
          return { user: JSON.parse(saved) };
        } catch {}
      }
    }
    throw new Error('Sesi telah berakhir atau tidak valid.');
  },

  async updateProfile(
    data: Partial<User> & { password?: string; password_confirmation?: string }
  ): Promise<{ message: string; user: User }> {
    try {
      const res = await api.put<{ message: string; user: User }>('/auth/profile', data);
      if (res.data.user) {
        localStorage.setItem('wargalapor_user', JSON.stringify(res.data.user));
      }

      // Sync to Supabase
      try {
        if (data.email) {
          await supabase
            .from('users')
            .update({ name: data.name, phone: data.phone })
            .eq('email', data.email);
        }
      } catch (sbErr) {
        console.warn('Supabase sync profile skipped:', sbErr);
      }

      return res.data;
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Gagal memperbarui profil.';
      throw new Error(msg);
    }
  },

  async logout(): Promise<{ message: string }> {
    try {
      const res = await api.post<{ message: string }>('/auth/logout');
      return res.data;
    } catch {
      return { message: 'Berhasil keluar' };
    } finally {
      localStorage.removeItem('wargalapor_token');
      localStorage.removeItem('wargalapor_user');
    }
  },

  async forgotPassword(
    email: string
  ): Promise<{ message: string; identifier?: string; channel?: string }> {
    try {
      const res = await api.post<{ message: string; identifier?: string; channel?: string }>(
        '/auth/forgot-password',
        { email: email.toLowerCase().trim() }
      );
      return res.data;
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Gagal mengajukan reset kata sandi.';
      throw new Error(msg);
    }
  },

  async resetPassword(data: {
    email: string;
    otp_code: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ message: string }> {
    try {
      const res = await api.post<{ message: string }>('/auth/reset-password', {
        ...data,
        email: data.email.toLowerCase().trim(),
        otp_code: data.otp_code.trim(),
      });
      return res.data;
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Gagal mengatur ulang kata sandi. Pastikan kode OTP sesuai.';
      throw new Error(msg);
    }
  },
};
