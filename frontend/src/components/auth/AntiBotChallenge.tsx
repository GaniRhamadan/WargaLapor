import React, { useEffect, useState } from 'react';
import { ShieldCheck, RefreshCw, CheckCircle2, Lock } from 'lucide-react';
import { authService } from '../../services/authService';
import { SecurityChallenge } from '../../types/auth';

interface AntiBotChallengeProps {
  onChallengeChange: (data: { token: string; answer: string; isValid: boolean }) => void;
  honeypotValue: string;
  setHoneypotValue: (val: string) => void;
}

export const AntiBotChallenge: React.FC<AntiBotChallengeProps> = ({
  onChallengeChange,
  honeypotValue,
  setHoneypotValue,
}) => {
  const [challenge, setChallenge] = useState<SecurityChallenge | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);

  const fetchChallenge = async () => {
    setLoading(true);
    setAnswer('');
    setIsAnswered(false);
    try {
      const data = await authService.getSecurityChallenge();
      setChallenge(data);
      onChallengeChange({ token: data.token, answer: '', isValid: false });
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenge();
  }, []);

  const handleAnswerChange = (val: string) => {
    // Only allow alphanumeric characters, uppercase, max 5 chars
    const cleaned = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    setAnswer(cleaned);
    const valid = cleaned.length >= 4 && challenge !== null;
    setIsAnswered(valid);
    if (challenge) {
      onChallengeChange({
        token: challenge.token,
        answer: cleaned,
        isValid: valid,
      });
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3 transition-all shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block leading-tight">
              Verifikasi Keamanan CAPTCHA
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Proteksi Anti-Bot & Scraper
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchChallenge}
          disabled={loading}
          className="text-xs text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100/80 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors border border-teal-200/60 cursor-pointer disabled:opacity-50"
          title="Ganti Gambar CAPTCHA"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Ganti</span>
        </button>
      </div>

      {/* Hidden Honeypot Traps for Spambots */}
      <div className="hidden" aria-hidden="true">
        <input
          type="text"
          name="website_url"
          tabIndex={-1}
          autoComplete="off"
          value={honeypotValue}
          onChange={(e) => setHoneypotValue(e.target.value)}
        />
        <input
          type="text"
          name="bot_trap"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      {/* Visual CAPTCHA Image & User Input Box */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Visual Distorted Image Container */}
        <div
          onClick={fetchChallenge}
          title="Klik gambar untuk memuat ulang CAPTCHA"
          className="sm:col-span-7 h-14 rounded-xl overflow-hidden bg-[#141826] border border-slate-800 flex items-center justify-center cursor-pointer select-none shadow-inner relative group"
        >
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
              <span>Membuat CAPTCHA...</span>
            </div>
          ) : challenge?.captcha_image ? (
            <>
              <img
                src={challenge.captcha_image}
                alt="Kode Verifikasi CAPTCHA"
                className="w-full h-full object-cover pointer-events-none"
              />
              <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white/90 font-medium backdrop-blur-[1px]">
                Klik untuk ganti
              </div>
            </>
          ) : (
            <span className="text-rose-400 text-xs font-semibold">Gagal memuat CAPTCHA</span>
          )}
        </div>

        {/* Input Box for 5-digit CAPTCHA */}
        <div className="sm:col-span-5 relative">
          <input
            type="text"
            required
            maxLength={5}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="KODE..."
            value={answer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            className="w-full h-14 text-base px-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white font-mono font-black tracking-widest text-center uppercase text-slate-800 placeholder:text-slate-400 placeholder:font-sans placeholder:tracking-normal placeholder:font-medium placeholder:text-xs"
          />
          {isAnswered && (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-5 pointer-events-none" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-0.5">
        <Lock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
        <span>Ketik 5 karakter di atas untuk verifikasi keamanan non-bot.</span>
      </div>
    </div>
  );
};
