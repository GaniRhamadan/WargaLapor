import React, { useState } from 'react';
import { AiAnalysis } from '../../types/report';
import { Bot, ChevronDown, ChevronUp, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AiAnalysisBadgeProps {
  analysis?: AiAnalysis | null;
  compact?: boolean;
}

export const AiAnalysisBadge: React.FC<AiAnalysisBadgeProps> = ({ analysis, compact = false }) => {
  const [expanded, setExpanded] = useState(false);

  if (!analysis) return null;

  const severityColors = {
    critical: 'bg-rose-50 border-rose-200 text-rose-700',
    high: 'bg-orange-50 border-orange-200 text-orange-700',
    medium: 'bg-amber-50 border-amber-200 text-amber-700',
    low: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  }[analysis.severity] || 'bg-teal-50 border-teal-200 text-teal-700';

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${severityColors}`}>
        <Sparkles className="w-3 h-3 text-teal-600 animate-spin" style={{ animationDuration: '4s' }} />
        <span>AI: {analysis.severity.toUpperCase()}</span>
        <span className="text-[10px] opacity-75">({Math.round(analysis.confidence * 100)}%)</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-teal-200/80 bg-linear-to-br from-teal-50/60 via-white to-sky-50/40 p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">Analisis Otomatis Gemini AI</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                Confidence: {Math.round(analysis.confidence * 100)}%
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Klasifikasi keparahan: <strong className="uppercase text-teal-700">{analysis.severity}</strong> • Bahaya: <strong className="uppercase text-slate-700">{analysis.hazard_level}</strong>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {analysis.summary && (
        <div className="mt-3 text-xs text-slate-700 bg-white/80 p-3 rounded-xl border border-slate-100 leading-relaxed">
          <p className="font-semibold text-slate-800 mb-0.5">Ringkasan Masalah:</p>
          {analysis.summary}
        </div>
      )}

      {expanded && analysis.recommendation && (
        <div className="mt-2 text-xs text-slate-700 bg-teal-50/70 p-3 rounded-xl border border-teal-100 leading-relaxed">
          <p className="font-semibold text-teal-900 mb-0.5 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            Rekomendasi Penanganan untuk Petugas:
          </p>
          {analysis.recommendation}
        </div>
      )}
    </div>
  );
};
