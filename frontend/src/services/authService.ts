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
    const rawInput = data.email.trim();
    const cleanEmail = rawInput.toLowerCase();

    // 1. Coba login ke API Backend Laravel resmi (Localhost / Full-Stack / Cloudflare Tunnel)
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
      // Jika error 422 atau 401 dari backend Laravel yang aktif, lemparkan pesan validasi asli
      if (err.response?.status === 422 || (err.response?.status === 401 && !err.isHtmlRewrite)) {
        const msg =
          err.response?.data?.message ||
          err.response?.data?.errors?.email?.[0] ||
          'Email atau kata sandi tidak valid.';
        throw new Error(msg);
      }

      // 2. Jika backend offline, 404, atau 405 (Host Static Vercel yang tidak menjalankan PHP Laravel)
      console.warn('Backend Laravel offline / 405 di Vercel, mengaktifkan Fallback Akun Demo & Supabase...');

      // A. Kredensial Akun Demo Cepat (Ready to use di Vercel)
      const DEMO_CREDENTIALS: Record<string, User> = {
        'admin@wargalapor.test': {
          id: 1,
          name: 'Administrator Kota',
          email: 'admin@wargalapor.test',
          phone: '081122334455',
          nik: '3171010000000001',
          role: 'admin',
          status: 'active',
        },
        'petugas@wargalapor.test': {
          id: 2,
          name: 'Budi Santoso (TRC)',
          email: 'petugas@wargalapor.test',
          phone: '081234567891',
          nik: '3171010000000002',
          role: 'officer',
          status: 'active',
          officer_profile: {
            id: 1,
            department: 'Dinas Bina Marga',
            unit: 'Tim Reaksi Cepat',
            area_coverage: 'Jakarta Pusat',
            active_tasks_count: 3,
            completed_tasks_count: 24,
            status: 'available',
          },
        },
        'petugas2@wargalapor.test': {
          id: 4,
          name: 'Siti Rahma (DLH)',
          email: 'petugas2@wargalapor.test',
          phone: '081234567892',
          nik: '3171010000000004',
          role: 'officer',
          status: 'active',
          officer_profile: {
            id: 2,
            department: 'Dinas Lingkungan Hidup',
            unit: 'Satgas Kebersihan',
            area_coverage: 'Jakarta Selatan',
            active_tasks_count: 2,
            completed_tasks_count: 18,
            status: 'available',
          },
        },
        'warga@wargalapor.test': {
          id: 3,
          name: 'Ahmad Syarif',
          email: 'warga@wargalapor.test',
          phone: '081234567890',
          nik: '3171012345678901',
          role: 'citizen',
          status: 'active',
        },
      };

      const matchedDemoKey = Object.keys(DEMO_CREDENTIALS).find(
        (key) => key === cleanEmail || DEMO_CREDENTIALS[key].nik === rawInput
      );

      if (matchedDemoKey) {
        if (data.password === 'password') {
          const demoUser = DEMO_CREDENTIALS[matchedDemoKey];
          const token = 'demo_token_' + btoa(demoUser.email);
          localStorage.setItem('wargalapor_token', token);
          localStorage.setItem('wargalapor_user', JSON.stringify(demoUser));
          return {
            message: 'Berhasil masuk (Mode Cloud Demo)',
            user: demoUser,
            token,
          };
        } else {
          throw new Error('Kata sandi salah. Untuk akun demo, gunakan kata sandi: password');
        }
      }

      // B. Coba login via Supabase Auth untuk akun umum
      try {
        const authRes = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: data.password,
        });

        if (!authRes.error && authRes.data.user) {
          const email = authRes.data.user.email || cleanEmail;
          const { data: userProfile } = await supabase
            .from('users')
            .select('*, officers(*)')
            .eq('email', email)
            .maybeSingle();

          const userObj: User = {
            id: userProfile?.id || Date.now(),
            name: userProfile?.name || authRes.data.user.user_metadata?.name || email.split('@')[0],
            email: email,
            phone: userProfile?.phone || null,
            nik: userProfile?.nik || null,
            role: (userProfile?.role || 'citizen') as UserRole,
            avatar: userProfile?.avatar,
            status: (userProfile?.status || 'active') as UserStatus,
            officer_profile: userProfile?.officers?.[0] || null,
          };

          const token = authRes.data.session?.access_token || 'sb_token_' + btoa(email);
          localStorage.setItem('wargalapor_token', token);
          localStorage.setItem('wargalapor_user', JSON.stringify(userObj));

          return {
            message: 'Berhasil masuk via Supabase',
            user: userObj,
            token,
          };
        }
      } catch (sbErr) {
        console.warn('Supabase auth login skipped:', sbErr);
      }

      throw new Error(
        'Gagal masuk. Periksa kembali email dan kata sandi Anda. Anda dapat mencoba akun demo: admin@wargalapor.test (kata sandi: password).'
      );
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
