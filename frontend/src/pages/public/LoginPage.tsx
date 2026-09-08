import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Lock, User, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { OtpVerificationModal } from '../../components/auth/OtpVerificationModal';
import { AntiBotChallenge } from '../../components/auth/AntiBotChallenge';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Credentials State (email or 16-digit NIK)
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        email: identifier,
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
        'Gagal masuk. Periksa kembali email/NIK dan kata sandi Anda.'
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
    <div className="h-screen max-h-screen overflow-hidden flex flex-col lg:flex-row bg-gradient-to-br from-[#d4f0e7] via-[#c6eae0] to-[#b2e2d6] relative">
      {/* Floating Back to Home button */}
      <Link
        to="/"
        className="absolute top-4 left-4 z-30 flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-teal-800 bg-white/90 hover:bg-white backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-md hover:shadow-lg border border-white/80 hover:border-teal-200/80 transition-all duration-200 group"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-teal-600" />
        <span>Kembali ke Beranda</span>
      </Link>

      {/* Left Column: Brand Illustration Artwork (50% of screen) */}
      <div className="w-full lg:w-1/2 h-full relative overflow-hidden bg-[#d0ece5] hidden lg:flex items-center justify-center select-none">
        <img
          src="/auth-illustration.jpg"
          alt="Warga Lapor — Smart Citizen Reporting"
          className="w-full h-full object-cover animate-art-fade"
          style={{
            objectPosition: 'center 62%',
            maskImage: 'linear-gradient(to right, black 88%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, black 88%, transparent 100%)',
          }}
        />
      </div>

      {/* Right Column: Seamlessly Blended Form Environment (50% of screen) */}
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-gradient-to-br from-[#cbeee5]/90 via-[#d6f2ea]/90 to-[#bde5db]/90">
        {/* Soft Ambient Radial Glows */}
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-teal-300/30 blur-3xl pointer-events-none animate-ambient-float" />
        <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none animate-ambient-float-slow" />

        {/* Frosted Glass Console Card */}
        <div className="w-full max-w-[425px] bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-teal-950/15 border border-white/90 p-6 sm:p-7 relative z-20 my-auto animate-auth-card">
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
              {/* Top Mode Switcher Tabs */}
              <div className="flex rounded-xl bg-slate-100/90 p-1 mb-3.5 border border-slate-200/60">
                <button
                  type="button"
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-white text-teal-800 shadow-xs transition-all duration-200 text-center cursor-default"
                >
                  Masuk
                </button>
                <Link
                  to="/register"
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-teal-700 hover:bg-white/60 transition-all duration-200 text-center"
                >
                  Daftar
                </Link>
              </div>

              {/* Card Header Title */}
              <div className="text-center mb-3.5">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  Masuk ke Warga Lapor
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Portal Layanan Pengaduan Masyarakat Terpadu
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight font-medium">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Email / NIK Field */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Email atau NIK
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 group-focus-within:scale-110 transition-all duration-200">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan email atau NIK"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full text-sm pl-10 pr-3.5 py-2 rounded-xl border border-slate-200/90 bg-white/90 hover:bg-white focus:bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 focus:shadow-sm transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Kata Sandi
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 group-focus-within:scale-110 transition-all duration-200">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Masukkan kata sandi"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-sm pl-10 pr-10 py-2 rounded-xl border border-slate-200/90 bg-white/90 hover:bg-white focus:bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 focus:shadow-sm transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-teal-600 hover:scale-110 active:scale-95 focus:outline-none cursor-pointer transition-all duration-150"
                      title={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-slate-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                      )}
                    </button>
                  </div>

                  {/* Right-aligned Forgot Password Link */}
                  <div className="flex justify-end pt-0.5">
                    <Link
                      to="/forgot-password"
                      className="text-xs font-medium text-teal-700 hover:text-teal-800 hover:underline transition-colors duration-150"
                    >
                      Lupa Kata Sandi?
                    </Link>
                  </div>
                </div>

                {/* Layered Anti-Bot Captcha Verification (Compact) */}
                <AntiBotChallenge
                  compact={true}
                  onChallengeChange={setSecurityData}
                  honeypotValue={honeypotValue}
                  setHoneypotValue={setHoneypotValue}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={loading}
                  className="w-full font-bold bg-gradient-to-r from-[#0d9488] to-[#14b8a6] hover:from-[#0f766e] hover:to-[#0d9488] text-white py-2.5 rounded-xl shadow-md shadow-teal-700/20 hover:shadow-xl hover:shadow-teal-700/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] text-sm sm:text-base transition-all duration-200 cursor-pointer flex items-center justify-center mt-1"
                >
                  Masuk ke Portal
                </Button>
              </form>

              {/* Bottom Register Redirect */}
              <div className="mt-3.5 text-center text-xs text-slate-600">
                Belum punya akun?{' '}
                <Link
                  to="/register"
                  className="font-bold text-teal-700 hover:text-teal-800 hover:underline transition-colors duration-150"
                >
                  Daftar Sekarang
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
