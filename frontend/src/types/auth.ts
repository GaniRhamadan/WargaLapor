export type UserRole = 'admin' | 'officer' | 'citizen';
export type UserStatus = 'active' | 'suspended' | 'pending_verification';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  nik?: string | null;
  role: UserRole;
  avatar?: string | null;
  status: UserStatus;
  email_verified_at?: string | null;
  phone_verified_at?: string | null;
  officer_profile?: {
    id: number;
    department: string;
    unit?: string | null;
    area_coverage?: string | null;
    active_tasks_count: number;
    completed_tasks_count: number;
    status: string;
  } | null;
  created_at?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface RegisterOtpResponse {
  status: 'PENDING_OTP';
  message: string;
  identifier: string;
  phone?: string;
  channel: string;
  expires_at: string;
  demo_otp?: string;
}

export interface SecurityChallenge {
  question: string;
  token: string;
  expires_in_seconds: number;
}

export interface VerifyOtpPayload {
  identifier: string;
  otp_code: string;
  type?: 'REGISTER' | 'LOGIN_2FA' | 'FORGOT_PASSWORD';
}
