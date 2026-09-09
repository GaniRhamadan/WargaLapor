import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Mail, RefreshCw, AlertCircle, Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';
import { authService } from '../../services/authService';

interface OtpVerificationModalProps {
  identifier: string;
  phone?: string | null;
  channel?: string;
  onVerified: (user: any) => void;
  onCancel?: () => void;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  identifier,
  phone,
  channel = 'Email Aktif',
  onVerified,
  onCancel,
}) => {
  const OTP_LENGTH = 6;
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();

    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleChange = (index: number, value: string) => {
    // Hanya izinkan angka
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError(null);

    // Auto-advance ke input berikutnya
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit jika semua 6 digit sudah terisi
    const fullCode = newOtp.join('');
    if (fullCode.length === OTP_LENGTH && !newOtp.includes('')) {
      handleVerify(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pastedData.length > 0) {
      const digits = pastedData.split('');
      while (digits.length < OTP_LENGTH) digits.push('');
      setOtp(digits);
      setError(null);
      if (pastedData.length === OTP_LENGTH) {
        handleVerify(pastedData);
      } else {
        inputRefs.current[pastedData.length]?.focus();
      }
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const fullCode = (codeToVerify || otp.join('')).trim();
    if (fullCode.length !== OTP_LENGTH) {
      setError('Harap masukkan tepat 6 digit kode OTP dari email Anda.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authService.verifyOtp({
        identifier,
        otp_code: fullCode,
        type: 'REGISTER',
      });
      onVerified(res.user);
    } catch (err: any) {
      setError(
        err.message ||
        err.response?.data?.message ||
        'Kode OTP tidak valid atau salah. Harap periksa email Anda kembali.'
      );
      // Kosongkan digit jika salah untuk keamanan
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setError(null);
    setSuccessNotice(null);

    try {
      const res = await authService.resendOtp(identifier, 'REGISTER');
      setResendCooldown(60);
      setSuccessNotice(res.message || 'Kode OTP baru telah berhasil dikirim ke email Anda.');
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimeout(() => setSuccessNotice(null), 6000);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim ulang kode OTP. Silakan coba beberapa saat lagi.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1.5">
        <div className="w-13 h-13 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center mx-auto shadow-xs">
          <Lock className="w-6 h-6 text-teal-600" />
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          Verifikasi Kode OTP Resmi
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Masukkan 6 digit kode OTP yang kami kirimkan ke kotak masuk email aktif Anda:
        </p>
        <p className="text-sm font-bold text-teal-700 bg-teal-50/80 px-3 py-1 rounded-xl inline-block border border-teal-200/60">
          {identifier}
        </p>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 text-xs flex items-center gap-2.5">
        <Mail className="w-4 h-4 text-teal-600 shrink-0" />
        <span className="leading-relaxed">
          Pengirim resmi: <strong className="text-slate-800">parabu12siliwangi@gmail.com</strong>
        </span>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-shake shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span className="leading-tight font-semibold">{error}</span>
        </div>
      )}

      {successNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span className="leading-tight font-medium">{successNotice}</span>
        </div>
      )}

      {/* 6 Digit Inputs */}
      <div className="space-y-4">
        <div className="flex justify-center items-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-black rounded-xl border-2 transition-all outline-none ${
                digit
                  ? 'border-teal-600 bg-teal-50/50 text-teal-900 shadow-sm ring-2 ring-teal-500/20'
                  : 'border-slate-200 bg-white text-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20'
              }`}
            />
          ))}
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          isLoading={loading}
          disabled={otp.join('').length !== OTP_LENGTH}
          onClick={() => handleVerify()}
          className="w-full font-bold shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 text-sm"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Verifikasi & Masuk Akun</span>
        </Button>
      </div>

      {/* Resend Action */}
      <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Belum menerima kode OTP?</span>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || resendLoading}
          className={`font-bold transition-colors flex items-center gap-1.5 ${
            resendCooldown > 0 || resendLoading
              ? 'text-slate-400 cursor-not-allowed'
              : 'text-teal-600 hover:text-teal-700 underline cursor-pointer'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
          {resendCooldown > 0 ? (
            <span>Kirim Ulang ({resendCooldown}s)</span>
          ) : (
            <span>Kirim Ulang Kode OTP</span>
          )}
        </button>
      </div>

      {onCancel && (
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            ← Kembali ke formulir pendaftaran
          </button>
        </div>
      )}
    </div>
  );
};
