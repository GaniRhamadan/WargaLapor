import React, { useEffect, useState } from 'react';
import { ShieldCheck, RefreshCw, ShieldAlert, CheckCircle2 } from 'lucide-react';
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
    setAnswer(val);
    const valid = val.trim().length > 0 && challenge !== null;
    setIsAnswered(valid);
    if (challenge) {
      onChallengeChange({
        token: challenge.token,
        answer: val.trim(),
        isValid: valid,
      });
    }
  };

  return (
    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-800">
            Verifikasi Anti-Spam Bot
          </span>
        </div>
        <button
          type="button"
          onClick={fetchChallenge}
          disabled={loading}
          className="text-[11px] text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 transition-colors"
          title="Ganti Soal Verifikasi"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
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

      <div className="flex items-center gap-3">
        <div className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 select-none shadow-inner flex items-center justify-between">
          {loading ? (
            <span className="text-slate-400 animate-pulse">Memuat tantangan keamanan...</span>
          ) : challenge ? (
            <span>{challenge.question}</span>
          ) : (
            <span className="text-rose-500 text-[11px]">Gagal memuat tantangan</span>
          )}
        </div>

        <div className="relative w-28 shrink-0">
          <input
            type="number"
            required
            placeholder="Jawaban"
            value={answer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white font-bold text-center"
          />
          {isAnswered && (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 absolute right-2 top-2.5 pointer-events-none" />
          )}
        </div>
      </div>
      <p className="text-[10px] text-slate-500 flex items-center gap-1">
        <ShieldAlert className="w-3 h-3 text-slate-400 shrink-0" />
        <span>Sistem keamanan mendeteksi & memblokir bot spam secara otomatis.</span>
      </p>
    </div>
  );
};
