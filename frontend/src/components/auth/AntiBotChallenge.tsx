import React, { useEffect, useState } from 'react';
import { ShieldCheck, RefreshCw, CheckCircle2, Lock } from 'lucide-react';
import { authService } from '../../services/authService';
import { SecurityChallenge } from '../../types/auth';

interface AntiBotChallengeProps {
  onChallengeChange: (data: { token: string; answer: string; isValid: boolean }) => void;
  honeypotValue: string;
  setHoneypotValue: (val: string) => void;
  compact?: boolean;
}

export const AntiBotChallenge: React.FC<AntiBotChallengeProps> = ({
  onChallengeChange,
  honeypotValue,
  setHoneypotValue,
  compact = false,
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
    <div
      className={`${
        compact
          ? 'p-2.5 rounded-xl bg-slate-50/90 border border-slate-200 space-y-1.5'
          : 'p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3'
      } transition-all shadow-xs`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div
            className={`${
              compact ? 'w-5 h-5 rounded-md' : 'w-7 h-7 rounded-xl'
            } bg-teal-600 text-white flex items-center justify-center shadow-xs`}
          >
            <ShieldCheck className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
          </div>
          <div>
            <span
              className={`${
                compact ? 'text-[11px]' : 'text-xs'
              } font-bold text-slate-800 block leading-tight`}
            >
              Verifikasi CAPTCHA
            </span>
            {!compact && (
              <span className="text-[11px] text-slate-500 font-medium">
                Proteksi Anti-Bot & Scraper
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={fetchChallenge}
          disabled={loading}
          className={`${
            compact ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
          } text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100/80 rounded-lg font-semibold flex items-center gap-1 transition-all duration-150 border border-teal-200/60 hover:border-teal-300 active:scale-95 cursor-pointer disabled:opacity-50`}
          title="Ganti Gambar CAPTCHA"
        >
          <RefreshCw className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${loading ? 'animate-spin' : ''}`} />
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
      <div className={`grid grid-cols-12 ${compact ? 'gap-2' : 'gap-3'} items-center`}>
        {/* Visual Distorted Image Container */}
        <div
          onClick={fetchChallenge}
          title="Klik gambar untuk memuat ulang CAPTCHA"
          className={`col-span-7 ${
            compact ? 'h-10 sm:h-11 rounded-lg' : 'h-14 rounded-xl'
          } overflow-hidden bg-[#141826] border border-slate-800 hover:border-teal-500/60 transition-colors duration-200 flex items-center justify-center cursor-pointer select-none shadow-inner relative group`}
        >
          {loading ? (
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
              <span>Memuat...</span>
            </div>
          ) : challenge?.captcha_image ? (
            <>
              <img
                src={challenge.captcha_image}
                alt="Kode Verifikasi CAPTCHA"
                className="w-full h-full object-cover pointer-events-none"
              />
              <div className="absolute inset-0 bg-slate-950/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[9px] text-white/90 font-medium backdrop-blur-[1px]">
                Ganti
              </div>
            </>
          ) : (
            <span className="text-rose-400 text-[10px] font-semibold">Gagal memuat</span>
          )}
        </div>

        {/* Input Box for 5-digit CAPTCHA */}
        <div className="col-span-5 relative">
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
            className={`w-full ${
              compact ? 'h-10 sm:h-11 text-sm' : 'h-14 text-base'
            } px-2 rounded-lg border border-slate-300 focus:ring-4 focus:ring-teal-500/15 focus:border-teal-500 outline-none bg-white font-mono font-bold tracking-widest text-center uppercase text-slate-800 placeholder:text-slate-400 placeholder:font-sans placeholder:tracking-normal placeholder:font-medium placeholder:text-[11px] transition-all duration-200`}
          />
          {isAnswered && (
            <CheckCircle2
              className={`${
                compact ? 'w-3.5 h-3.5 right-1.5 top-3.5' : 'w-4 h-4 right-3 top-5'
              } text-emerald-600 absolute pointer-events-none transition-transform animate-scale-up`}
            />
          )}
        </div>
      </div>

      <div
        className={`flex items-center gap-1 ${
          compact ? 'text-[10px]' : 'text-[11px]'
        } text-slate-400 pt-0.5`}
      >
        <Lock className={compact ? 'w-3 h-3 text-teal-600 shrink-0' : 'w-3.5 h-3.5 text-teal-600 shrink-0'} />
        <span>Ketik 5 karakter kode anti-bot</span>
      </div>
    </div>
  );
};
