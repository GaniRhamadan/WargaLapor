import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Button } from '../../components/common/Button';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // Step 1: EMAIL, Step 2: RESET_OTP
  const [step, setStep] = useState<'EMAIL' | 'RESET_OTP'>('EMAIL');
  const [email, setEmail] = useState('');

  // Step 2 Form States
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Resend OTP Cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first OTP input when transitioning to Step 2
  useEffect(() => {
    if (step === 'RESET_OTP') {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Step 1: Send OTP to Email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setResendSuccess(null);
    setLoading(true);

    try {
      const res = await authService.forgotPassword(email.trim().toLowerCase());
      setStep('RESET_OTP');
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      setPassword('');
      setPasswordConfirmation('');
      setSuccessMsg(res.message || `Kode OTP 6-digit telah dikirimkan ke Gmail Anda (${email}).`);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
          'Gagal mengirim kode OTP. Pastikan email Anda sudah terdaftar atau periksa koneksi internet.'
      );
    } finally {
      setLoading(false);
    }
  };

  // OTP Input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setErrorMsg(null);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setErrorMsg(null);
    setResendSuccess(null);
    setResendLoading(true);

    try {
      const res = await authService.resendOtp(email.trim().toLowerCase(), 'FORGOT_PASSWORD');
      setResendCooldown(res.wait_seconds || 60);
      setResendSuccess('Kode OTP baru telah berhasil dikirimkan ke Gmail Anda.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal mengirim ulang kode OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  // Step 2: Submit Reset Password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setResendSuccess(null);

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setErrorMsg('Masukkan 6 digit kode OTP verifikasi dengan lengkap.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Kata sandi baru minimal harus 6 karakter.');
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMsg('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.resetPassword({
        email: email.trim().toLowerCase(),
        otp_code: otpCode,
        password,
        password_confirmation: passwordConfirmation,
      });

      setSuccessMsg(res.message || 'Kata sandi Anda berhasil diperbarui! Mengalihkan ke halaman masuk...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal mereset kata sandi. Periksa kode OTP Anda.');
    } finally {
      setLoading(false);
    }
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
          <div className="text-center mb-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Pemulihan Kata Sandi
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {step === 'EMAIL'
                ? 'Masukkan alamat email akun Anda untuk menerima 6 digit kode OTP.'
                : 'Verifikasi kode OTP dan buat kata sandi baru untuk akun Anda.'}
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-tight font-medium">{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {/* STEP 1: INPUT EMAIL */}
          {step === 'EMAIL' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Alamat Email Terdaftar
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 group-focus-within:scale-110 transition-all duration-200">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm pl-10 pr-3.5 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-white/90 hover:bg-white focus:bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 focus:shadow-sm transition-all duration-200"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={loading}
                className="w-full font-bold bg-gradient-to-r from-[#0d9488] to-[#14b8a6] hover:from-[#0f766e] hover:to-[#0d9488] text-white py-2.5 rounded-xl shadow-md shadow-teal-700/20 hover:shadow-xl hover:shadow-teal-700/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] text-sm sm:text-base transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Kirim Kode OTP</span>
              </Button>

              <div className="mt-5 text-center text-xs sm:text-sm text-slate-600">
                <Link
                  to="/login"
                  className="font-semibold text-teal-600 hover:text-teal-700 hover:underline inline-flex items-center gap-1 transition-colors duration-150"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Halaman Masuk</span>
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: VERIFY OTP & RESET PASSWORD */}
          {step === 'RESET_OTP' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {resendSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{resendSuccess}</span>
                </div>
              )}

              {/* 6 Digit OTP Inputs */}
              <div className="space-y-1.5 text-center">
                <label className="text-xs font-semibold text-slate-700 block text-left">
                  6 Digit Kode OTP
                </label>
                <div className="flex justify-center items-center gap-2 sm:gap-2.5 pt-1" onPaste={handleOtpPaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className={`w-10 h-12 sm:w-11 sm:h-13 text-center text-lg sm:text-xl font-black rounded-xl border-2 transition-all duration-150 outline-none ${
                        digit
                          ? 'border-teal-600 bg-teal-50/40 text-teal-900 shadow-sm scale-[1.02]'
                          : 'border-slate-200 bg-white text-slate-900 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 hover:border-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Kata Sandi Baru
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 group-focus-within:scale-110 transition-all duration-200">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Min. 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-sm pl-10 pr-10 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-white/90 hover:bg-white focus:bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 focus:shadow-sm transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-teal-600 hover:scale-110 active:scale-95 focus:outline-none cursor-pointer transition-all duration-150"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 group-focus-within:scale-110 transition-all duration-200">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Ulangi kata sandi baru"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    className="w-full text-sm pl-10 pr-10 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-white/90 hover:bg-white focus:bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 focus:shadow-sm transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-teal-600 hover:scale-110 active:scale-95 focus:outline-none cursor-pointer transition-all duration-150"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={loading}
                disabled={otp.join('').length !== 6 || !password || !passwordConfirmation}
                className="w-full font-bold bg-gradient-to-r from-[#0d9488] to-[#14b8a6] hover:from-[#0f766e] hover:to-[#0d9488] text-white py-2.5 rounded-xl shadow-md shadow-teal-700/20 hover:shadow-xl hover:shadow-teal-700/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] text-sm sm:text-base transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Simpan Kata Sandi Baru</span>
              </Button>

              {/* Resend OTP */}
              <div className="pt-2 text-center text-xs text-slate-500 flex items-center justify-between gap-2 border-t border-slate-100">
                <span>Belum terima kode?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || resendLoading}
                  className={`font-semibold transition-colors flex items-center gap-1.5 ${
                    resendCooldown > 0 || resendLoading
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-teal-600 hover:text-teal-700 underline cursor-pointer'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${resendLoading ? 'animate-spin' : ''}`} />
                  {resendCooldown > 0 ? (
                    <span>Kirim Ulang ({resendCooldown}s)</span>
                  ) : (
                    <span>Kirim Ulang OTP</span>
                  )}
                </button>
              </div>

              {/* Back to Step 1 */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep('EMAIL');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setResendSuccess(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Ganti Alamat Email</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
