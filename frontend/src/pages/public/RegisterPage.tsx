import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Shield, Lock, Mail, User, Phone, IdCard, AlertCircle, ShieldCheck, CheckCircle2, Eye, EyeOff } from 'lucide-react';
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

  // Flow State
  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');
  const [otpInfo, setOtpInfo] = useState<{ identifier: string; phone?: string; channel: string }>({
    identifier: '',
    phone: '',
    channel: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Check Password Match
    if (password !== passwordConfirmation) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    // 2. Anti-Bot Security Check
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
        website_url: honeypotValue, // bot trap
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
    <div className="min-h-[calc(100vh-144px)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-lg space-y-6">
        
        {/* Step Indicator Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-md shadow-teal-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {step === 'FORM' ? 'Daftar Akun Warga Terverifikasi' : 'Verifikasi Akun Aktif'}
          </h2>
          <p className="text-xs text-slate-500">
            {step === 'FORM'
              ? 'Daftarkan akun aktif Anda dengan verifikasi kode OTP dan proteksi anti-spam bot.'
              : 'Pastikan nomor HP atau email Anda aktif untuk menerima 6 digit kode keamanan.'}
          </p>

          {/* Stepper Pills */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${
              step === 'FORM' ? 'bg-teal-600 text-white shadow-sm' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {step === 'OTP' ? <CheckCircle2 className="w-3 h-3" /> : <span>1</span>}
              <span>Data Diri</span>
            </div>
            <div className="w-6 h-0.5 bg-slate-200" />
            <div className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${
              step === 'OTP' ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 text-slate-400'
            }`}>
              <span>2</span>
              <span>Verifikasi OTP</span>
            </div>
          </div>
        </div>

        <Card className="p-6 sm:p-8 space-y-5 backdrop-blur-sm bg-white/95 shadow-xl border-slate-200/80">
          {step === 'FORM' ? (
            <>
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Nama Lengkap Sesuai KTP *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Alamat Email Aktif *</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="nama@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Nomor HP / WhatsApp Aktif *</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="tel"
                        required
                        placeholder="081234567890"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">NIK (16 Digit - Opsional)</label>
                  <div className="relative">
                    <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      maxLength={16}
                      placeholder="3171012304920001"
                      value={nik}
                      onChange={(e) => setNik(e.target.value)}
                      className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Kata Sandi (Min. 6 Karakter) *</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full text-xs pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-0.5"
                        title={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4 text-slate-600" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Konfirmasi Kata Sandi *</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        className="w-full text-xs pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-0.5"
                        title={showConfirmPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4 text-slate-600" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Anti-Bot Challenge & Honeypot */}
                <AntiBotChallenge
                  onChallengeChange={setSecurityData}
                  honeypotValue={honeypotValue}
                  setHoneypotValue={setHoneypotValue}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={loading}
                  className="w-full font-bold shadow-md shadow-teal-500/20 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Kirim Kode OTP & Lanjutkan</span>
                </Button>
              </form>

              <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
                Sudah memiliki akun?{' '}
                <Link to="/login" className="font-bold text-teal-600 hover:text-teal-700 underline">
                  Masuk di sini
                </Link>
              </div>
            </>
          ) : (
            <OtpVerificationModal
              identifier={otpInfo.identifier}
              phone={otpInfo.phone}
              channel={otpInfo.channel}
              onVerified={handleVerified}
              onCancel={() => setStep('FORM')}
            />
          )}
        </Card>
      </div>
    </div>
  );
};
