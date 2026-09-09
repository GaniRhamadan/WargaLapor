import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import {
  Lock,
  User,
  Mail,
  Phone,
  IdCard,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react';
import { AntiBotChallenge } from '../../components/auth/AntiBotChallenge';
import { OtpVerificationModal } from '../../components/auth/OtpVerificationModal';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [honeypotValue, setHoneypotValue] = useState('');

  // Security Challenge State
  const [securityData, setSecurityData] = useState<{ token: string; answer: string; isValid: boolean }>({
    token: '',
    answer: '',
    isValid: false,
  });

  // Flow State: 'FORM' | 'OTP'
  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');
  const [otpInfo, setOtpInfo] = useState<{ identifier: string; phone?: string; channel: string }>({
    identifier: '',
    phone: '',
    channel: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.startsWith('62')) {
      val = val.slice(2);
    }
    if (val.startsWith('0')) {
      val = val.slice(1);
    }
    if (val.length <= 13) {
      setPhone(val ? '+62' + val : '');
    }
  };

  const handleNikChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 16);
    setNik(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Password Confirmation Check
    if (password !== passwordConfirmation) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    // 2. Phone Length Check (enforce +62 Indonesian format with at least 8 digits)
    if (!phone || phone.length < 11 || phone.length > 16) {
      setError('Nomor HP/WhatsApp harus valid diawali +62 (minimal 9-13 digit angka, contoh: +62 812-3456-7890).');
      return;
    }

    // 3. NIK Length Check if filled (must be 16 digits)
    if (nik && nik.length !== 16) {
      setError('NIK harus berupa tepat 16 digit angka sesuai KTP.');
      return;
    }

    // 4. Anti-Bot Security Check
    if (!securityData.isValid) {
      setError('Harap lengkapi jawaban verifikasi anti-spam bot terlebih dahulu.');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        name,
        email,
        phone,
        nik: nik || undefined,
        password,
        password_confirmation: passwordConfirmation,
        security_token: securityData.token,
        security_answer: securityData.answer,
        website_url: honeypotValue,
      });

      // Move to Step 2: OTP Verification
      setOtpInfo({
        identifier: res.identifier,
        phone: res.phone,
        channel: res.channel,
      });
      setStep('OTP');
    } catch (err: any) {
      setError(
        err.message ||
        err.response?.data?.message ||
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.errors?.phone?.[0] ||
        'Registrasi gagal. Silakan periksa kembali isian formulir.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerified = (user: any) => {
    navigate(user.role === 'admin' ? '/admin' : (user.role === 'officer' ? '/officer' : '/citizen'));
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
          {step === 'OTP' ? (
            <div>
              <div className="text-center mb-4">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  Verifikasi Akun Warga
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Masukkan 6 digit kode OTP yang dikirimkan ke {otpInfo.channel || 'kontak Anda'}.
                </p>
              </div>

              <OtpVerificationModal
                identifier={otpInfo.identifier}
                phone={otpInfo.phone}
                channel={otpInfo.channel}
                onVerified={handleVerified}
                onCancel={() => setStep('FORM')}
              />
            </div>
          ) : (
            <>
              {/* Top Mode Switcher Tabs */}
              <div className="flex rounded-xl bg-slate-100/90 p-1 mb-3.5 border border-slate-200/60">
                <Link
                  to="/login"
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-teal-700 hover:bg-white/60 transition-all duration-200 text-center"
                >
                  Masuk
                </Link>
                <button
                  type="button"
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-white text-teal-800 shadow-xs transition-all duration-200 text-center cursor-default"
                >
                  Daftar
                </button>
              </div>

              {/* Card Header Title */}
              <div className="text-center mb-3.5">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  Daftar ke Warga Lapor
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Buat akun warga untuk mulai melapor kendala publik
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight font-medium">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-2.5">
                {/* Row 1: Nama Lengkap & Email (2-Column Grid) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Nama Lengkap
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 group-focus-within:scale-110 transition-all duration-200">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Nama KTP"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full text-xs pl-8 pr-2 py-2 rounded-xl border border-slate-200/90 bg-white/90 hover:bg-white focus:bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 focus:shadow-sm transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Alamat Email
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 group-focus-within:scale-110 transition-all duration-200">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="email"
                        required
                        placeholder="nama@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-xs pl-8 pr-2 py-2 rounded-xl border border-slate-200/90 bg-white/90 hover:bg-white focus:bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 focus:shadow-sm transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Phone & NIK (2-Column Grid) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 block">
                        No. WhatsApp/HP
                      </label>
                      <span className="text-[10px] text-teal-700 font-mono font-bold">
                        {phone || '+62'}
                      </span>
                    </div>
                    <div className="relative group flex items-center">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                        <span className="text-[11px] font-bold text-slate-600 bg-slate-100/90 px-1.5 py-0.5 rounded border border-slate-200">
                          🇮🇩 +62
                        </span>
                      </div>
                      <input
                        type="tel"
                        required
                        maxLength={13}
                        placeholder="81234567890"
                        value={phone.replace(/^\+62/, '')}
                        onChange={handlePhoneChange}
                        className="w-full text-xs pl-17 pr-2 py-2 rounded-xl border border-slate-200/90 bg-white/90 hover:bg-white focus:bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 focus:shadow-sm transition-all duration-200 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 block">
                        NIK KTP
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">{nik.length}/16</span>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 group-focus-within:scale-110 transition-all duration-200">
                        <IdCard className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        maxLength={16}
                        placeholder="16 digit NIK"
                        value={nik}
                        onChange={handleNikChange}
                        className="w-full text-xs pl-8 pr-2 py-2 rounded-xl border border-slate-200/90 bg-white/90 hover:bg-white focus:bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 focus:shadow-sm transition-all duration-200 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Password & Confirm Password (2-Column Grid) */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Kata Sandi
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 group-focus-within:scale-110 transition-all duration-200">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Min. 8 karakter"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full text-xs pl-8 pr-7 py-2 rounded-xl border border-slate-200/90 bg-white/90 hover:bg-white focus:bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 focus:shadow-sm transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-teal-600 hover:scale-110 active:scale-95 focus:outline-none cursor-pointer transition-all duration-150"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Konfirmasi Sandi
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-teal-600 group-focus-within:scale-110 transition-all duration-200">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Ulangi sandi"
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        className="w-full text-xs pl-8 pr-7 py-2 rounded-xl border border-slate-200/90 bg-white/90 hover:bg-white focus:bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 focus:shadow-sm transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-400 hover:text-teal-600 hover:scale-110 active:scale-95 focus:outline-none cursor-pointer transition-all duration-150"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
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
                  Daftar Sekarang
                </Button>
              </form>

              {/* Bottom Login Redirect */}
              <div className="mt-3.5 text-center text-xs text-slate-600">
                Sudah punya akun?{' '}
                <Link
                  to="/login"
                  className="font-bold text-teal-700 hover:text-teal-800 hover:underline transition-colors duration-150"
                >
                  Masuk ke Portal
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
