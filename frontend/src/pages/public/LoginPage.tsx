import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Shield, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { OtpVerificationModal } from '../../components/auth/OtpVerificationModal';
import { AntiBotChallenge } from '../../components/auth/AntiBotChallenge';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Credentials State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Anti-Bot Captcha Security State
  const [securityData, setSecurityData] = useState<{ token: string; answer: string; isValid: boolean }>({
    token: '',
    answer: '',
    isValid: false,
  });
  const [honeypotValue, setHoneypotValue] = useState('');

  // OTP Verification Intercept State (for unverified accounts)
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpData, setOtpData] = useState<{ identifier: string; phone?: string; channel?: string }>({
    identifier: '',
    phone: '',
    channel: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate Anti-Bot Captcha
    if (!securityData.isValid) {
      setError('Harap selesaikan verifikasi captcha anti-bot sebelum melanjutkan.');
      return;
    }

    setLoading(true);
    try {
      const res = await login({
        email,
        password,
        security_token: securityData.token,
        security_answer: securityData.answer,
        website_url: honeypotValue,
      });

      // Check if account needs OTP activation
      if (res && 'requires_otp' in res && res.requires_otp) {
        setOtpData({
          identifier: res.identifier,
          phone: res.phone,
          channel: res.channel || 'Email Aktif',
        });
        setOtpRequired(true);
        return;
      }

      // Automatic Role-Based Redirection
      const rawUser = localStorage.getItem('wargalapor_user');
      const parsed = rawUser ? JSON.parse(rawUser) : null;
      const userRole = parsed?.role || res?.user?.role;

      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'officer') {
        navigate('/officer');
      } else {
        navigate('/citizen');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.email?.[0] ||
        'Gagal masuk. Periksa kembali email dan kata sandi Anda.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerified = (verifiedUser: any) => {
    if (verifiedUser.role === 'admin') navigate('/admin');
    else if (verifiedUser.role === 'officer') navigate('/officer');
    else navigate('/citizen');
  };

  return (
    <div className="min-h-[calc(100vh-144px)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-5">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-13 h-13 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-teal-600/20">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {otpRequired ? 'Verifikasi OTP Akun' : 'Portal Masuk WargaLapor'}
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {otpRequired
              ? 'Akun Anda memerlukan aktivasi OTP untuk memastikan keaslian data.'
              : 'Masukkan alamat email dan kata sandi Anda untuk mengakses layanan.'}
          </p>
        </div>

        {/* Main Login Card */}
        <Card className="p-6 sm:p-8 space-y-5 backdrop-blur-sm bg-white/95 shadow-xl border-slate-200/80">
          {otpRequired ? (
            <OtpVerificationModal
              identifier={otpData.identifier}
              phone={otpData.phone}
              channel={otpData.channel}
              onVerified={handleOtpVerified}
              onCancel={() => setOtpRequired(false)}
            />
          ) : (
            <>
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight font-medium">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email / Identifier Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Alamat Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Kata Sandi</label>
                    <Link
                      to="/forgot-password"
                      className="text-[11px] font-semibold text-teal-600 hover:text-teal-700"
                    >
                      Lupa kata sandi?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Layered Anti-Bot Captcha Verification */}
                <AntiBotChallenge
                  onChallengeChange={setSecurityData}
                  honeypotValue={honeypotValue}
                  setHoneypotValue={setHoneypotValue}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={loading}
                  className="w-full font-bold shadow-md shadow-teal-500/20 flex items-center justify-center gap-2"
                >
                  <span>Masuk ke Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>

              {/* Bottom Register Redirect */}
              <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
                Belum memiliki akun warga?{' '}
                <Link to="/register" className="font-bold text-teal-600 hover:text-teal-700 underline">
                  Daftar Akun Baru (Aktivasi OTP)
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};
