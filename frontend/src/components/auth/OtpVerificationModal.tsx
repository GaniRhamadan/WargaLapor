import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Mail, MessageSquare, ArrowRight, RefreshCw, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
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
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();

    // Cooldown countdown
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only accept numeric digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    // Take the last entered character if multiple
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError(null);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 digits filled
    const fullCode = newOtp.join('');
    if (fullCode.length === 6 && !newOtp.includes('')) {
      handleVerify(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const fullCode = codeToVerify || otp.join('');
    if (fullCode.length !== 6) {
      setError('Harap masukkan 6 digit kode OTP secara lengkap.');
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
        err.response?.data?.message ||
        'Kode OTP tidak valid atau telah kedaluwarsa. Silakan periksa kembali.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setError(null);

    try {
      await authService.resendOtp(identifier, 'REGISTER');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengirim ulang kode OTP. Silakan periksa koneksi.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          Verifikasi Kode OTP Akun Aktif
        </h3>
        <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
          Masukkan 6 digit kode keamanan yang telah kami kirimkan ke{' '}
          <strong className="text-slate-900 font-semibold">{identifier}</strong>
          {phone && (
            <span> / WhatsApp <strong className="text-slate-900 font-semibold">{phone}</strong></span>
          )}.
        </p>
      </div>

      <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/80 text-teal-900 text-xs flex items-center gap-2.5">
        <Mail className="w-4 h-4 text-teal-600 shrink-0" />
        <span className="leading-relaxed">
          Kode OTP telah dikirimkan ke kotak masuk (inbox/spam) email Anda di <strong>{identifier}</strong>. Silakan periksa email Anda.
        </span>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-tight">{error}</span>
        </div>
      )}

      {/* 6 Digit Inputs */}
      <div className="space-y-4">
        <div className="flex justify-center items-center gap-2 sm:gap-3" onPaste={handlePaste}>
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
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-black rounded-xl border-2 transition-all outline-none ${
                digit
                  ? 'border-teal-600 bg-teal-50/40 text-teal-900 shadow-sm'
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
          disabled={otp.join('').length !== 6}
          onClick={() => handleVerify()}
          className="w-full font-bold shadow-md shadow-teal-500/20 flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Verifikasi & Aktifkan Akun</span>
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
              : 'text-teal-600 hover:text-teal-700 underline'
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
        <div className="text-center">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← Kembali ke formulir pendaftaran
          </button>
        </div>
      )}
    </div>
  );
};
