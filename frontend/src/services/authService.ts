import api from './api';
import { supabase } from './supabase';
import { AuthResponse, RegisterOtpResponse, SecurityChallenge, User, UserRole, UserStatus, VerifyOtpPayload } from '../types/auth';

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
    const identifier = data.email.trim();

    // 1. Coba login ke Supabase Auth (Real Production Authentication)
    let authRes = await supabase.auth.signInWithPassword({
      email: identifier,
      password: data.password,
    });

    // Jika user belum terdaftar di Supabase Auth tapi ada di tabel public.users (misal user awal dari seed)
    if (authRes.error) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${identifier},phone.eq.${identifier},nik.eq.${identifier}`)
        .maybeSingle();

      if (existingUser) {
        // Daftarkan langsung ke Supabase Auth dengan password yang dimasukkan
        const signUpRes = await supabase.auth.signUp({
          email: existingUser.email,
          password: data.password,
          options: {
            data: {
              name: existingUser.name,
              phone: existingUser.phone,
              role: existingUser.role,
            },
          },
        });

        if (!signUpRes.error && signUpRes.data.session) {
          authRes = { data: signUpRes.data, error: null } as any;
        } else {
          authRes = await supabase.auth.signInWithPassword({
            email: existingUser.email,
            password: data.password,
          });
        }
      }
    }

    if (authRes.error || !authRes.data.user) {
      throw new Error(
        authRes.error?.message === 'Invalid login credentials'
          ? 'Email atau kata sandi tidak cocok. Silakan periksa kembali.'
          : (authRes.error?.message || 'Gagal masuk ke akun. Silakan periksa koneksi Anda.')
      );
    }

    // 2. Ambil profil lengkap dari tabel public.users
    const userEmail = authRes.data.user.email || identifier;
    const { data: userProfile } = await supabase
      .from('users')
      .select('*, officers(*)')
      .eq('email', userEmail)
      .maybeSingle();

    const userObj: User = {
      id: userProfile?.id || Date.now(),
      name: userProfile?.name || authRes.data.user.user_metadata?.name || userEmail.split('@')[0],
      email: userEmail,
      phone: userProfile?.phone || authRes.data.user.user_metadata?.phone || null,
      nik: userProfile?.nik || authRes.data.user.user_metadata?.nik || null,
      role: (userProfile?.role || authRes.data.user.user_metadata?.role || 'citizen') as UserRole,
      avatar: userProfile?.avatar || null,
      status: (userProfile?.status || 'active') as UserStatus,
      officer_profile: userProfile?.officers?.[0]
        ? {
            id: userProfile.officers[0].id,
            department: userProfile.officers[0].department,
            unit: userProfile.officers[0].unit,
            area_coverage: userProfile.officers[0].area_coverage,
            active_tasks_count: userProfile.officers[0].active_tasks_count || 0,
            completed_tasks_count: userProfile.officers[0].completed_tasks_count || 0,
            status: userProfile.officers[0].status || 'available',
          }
        : null,
    };

    const token = authRes.data.session?.access_token || 'sb_token_' + btoa(userEmail);
    localStorage.setItem('wargalapor_token', token);
    localStorage.setItem('wargalapor_user', JSON.stringify(userObj));

    return {
      message: 'Login berhasil',
      user: userObj,
      token,
    };
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
    // Real Supabase Auth Registration
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          phone: data.phone,
          nik: data.nik || null,
          role: 'citizen',
        },
      },
    });

    if (error) {
      throw new Error(`Registrasi gagal: ${error.message}`);
    }

    // Simpan ke tabel public.users
    await supabase.from('users').upsert(
      {
        name: data.name,
        email: data.email,
        phone: data.phone,
        nik: data.nik || null,
        role: 'citizen',
        status: 'active',
      },
      { onConflict: 'email' }
    );

    // Jika Supabase langsung membuat session aktif
    if (authData.session) {
      const userObj: User = {
        id: Date.now(),
        name: data.name,
        email: data.email,
        phone: data.phone,
        nik: data.nik || null,
        role: 'citizen',
        status: 'active',
      };
      localStorage.setItem('wargalapor_token', authData.session.access_token);
      localStorage.setItem('wargalapor_user', JSON.stringify(userObj));
    }

    return {
      status: 'PENDING_OTP',
      message: 'Registrasi berhasil! Tautan konfirmasi telah dikirim ke email Anda.',
      identifier: data.email,
      phone: data.phone,
      channel: 'Email',
      expires_at: new Date(Date.now() + 600000).toISOString(),
    };
  },

  async verifyOtp(payload: VerifyOtpPayload): Promise<AuthResponse> {
    const cleanToken = payload.otp_code.trim();

    // 1. Validasi kode OTP secara ketat ke Supabase Auth
    const { data, error } = await supabase.auth.verifyOtp({
      email: payload.identifier.trim(),
      token: cleanToken,
      type: 'signup',
    });

    // Jika type signup gagal, coba type email
    let verifiedData = data;
    if (error) {
      const retry = await supabase.auth.verifyOtp({
        email: payload.identifier.trim(),
        token: cleanToken,
        type: 'email',
      });
      if (retry.error || !retry.data.user) {
        // TOLAK TEGAS: Jangan biarkan masuk jika kode OTP salah / asal-asalan!
        throw new Error('Kode OTP tidak valid atau salah. Harap masukkan kode yang sesuai di email Anda.');
      }
      verifiedData = retry.data;
    }

    if (!verifiedData.user) {
      throw new Error('Kode OTP tidak valid atau telah kedaluwarsa.');
    }

    const email = verifiedData.user.email || payload.identifier.trim();

    // 2. Aktifkan status user di database public.users
    await supabase.from('users').update({ status: 'active' }).eq('email', email);

    const { data: userProfile } = await supabase.from('users').select('*, officers(*)').eq('email', email).maybeSingle();

    const userObj: User = {
      id: userProfile?.id || Date.now(),
      name: userProfile?.name || verifiedData.user.user_metadata?.name || email.split('@')[0],
      email: email,
      phone: userProfile?.phone || verifiedData.user.user_metadata?.phone || null,
      nik: userProfile?.nik || verifiedData.user.user_metadata?.nik || null,
      role: (userProfile?.role || 'citizen') as UserRole,
      avatar: userProfile?.avatar || null,
      status: 'active',
      officer_profile: userProfile?.officers?.[0] || null,
    };

    const token = verifiedData.session?.access_token || 'sb_token_' + btoa(email);
    localStorage.setItem('wargalapor_token', token);
    localStorage.setItem('wargalapor_user', JSON.stringify(userObj));

    return {
      message: 'Akun berhasil diverifikasi!',
      user: userObj,
      token,
    };
  },

  async resendOtp(identifier: string, type: string = 'REGISTER'): Promise<{ message: string; channel?: string; wait_seconds?: number }> {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: identifier,
    });
    if (error) {
      throw new Error(`Gagal mengirim ulang: ${error.message}`);
    }
    return {
      message: 'Tautan atau kode verifikasi telah dikirim ulang ke email Anda.',
      channel: 'Email',
      wait_seconds: 60,
    };
  },

  async getMe(): Promise<{ user: User }> {
    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData.session?.user?.email;

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

    const saved = localStorage.getItem('wargalapor_user');
    if (saved) {
      return { user: JSON.parse(saved) };
    }
    throw new Error('Sesi telah berakhir');
  },

  async updateProfile(data: Partial<User> & { password?: string; password_confirmation?: string }): Promise<{ message: string; user: User }> {
    if (data.password) {
      await supabase.auth.updateUser({ password: data.password });
    }
    const saved = localStorage.getItem('wargalapor_user');
    const current = saved ? JSON.parse(saved) : {};
    const updated = { ...current, ...data };

    if (data.email) {
      await supabase.from('users').update({ name: data.name, phone: data.phone }).eq('email', data.email);
    }
    localStorage.setItem('wargalapor_user', JSON.stringify(updated));
    return { message: 'Profil berhasil diperbarui', user: updated };
  },

  async logout(): Promise<{ message: string }> {
    try {
      await supabase.auth.signOut();
    } finally {
      localStorage.removeItem('wargalapor_token');
      localStorage.removeItem('wargalapor_user');
    }
    return { message: 'Berhasil keluar' };
  },

  async forgotPassword(email: string): Promise<{ message: string; identifier?: string; channel?: string }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      throw new Error(`Gagal mengirim email reset password: ${error.message}`);
    }
    return {
      message: 'Instruksi reset kata sandi telah dikirim ke alamat email Anda.',
      identifier: email,
      channel: 'Email',
    };
  },

  async resetPassword(data: { email: string; otp_code: string; password: string; password_confirmation: string }): Promise<{ message: string }> {
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });
    if (error) {
      throw new Error(`Gagal mengatur ulang kata sandi: ${error.message}`);
    }
    return { message: 'Kata sandi Anda berhasil diperbarui. Silakan masuk kembali.' };
  },
};
