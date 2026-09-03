import React from 'react';
import { ReportStatusHistory, ReportImage } from '../../types/report';
import { CheckCircle2, Clock, HardHat, Shield, User, XCircle, AlertCircle } from 'lucide-react';
import { StatusBadge } from '../common/Badge';

interface StatusTimelineProps {
  histories?: ReportStatusHistory[];
  resolutionImage?: ReportImage | null;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ histories = [], resolutionImage }) => {
  if (!histories || histories.length === 0) {
    return <p className="text-xs text-slate-400">Belum ada riwayat aktivitas.</p>;
  }

  const getActorIcon = (role?: string | null) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-600" />;
      case 'officer':
        return <HardHat className="w-4 h-4 text-amber-600" />;
      case 'citizen':
        return <User className="w-4 h-4 text-teal-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {histories.map((history, idx) => {
        const isLatest = idx === histories.length - 1;
        const isResolved = history.status === 'RESOLVED' || history.status === 'CLOSED';
        const isRejected = history.status === 'REJECTED';

        return (
          <div key={history.id || idx} className="relative group">
            {/* Dot Node */}
            <div
              className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center bg-white shadow-xs ${
                isResolved
                  ? 'border-emerald-500 text-emerald-500 ring-4 ring-emerald-50'
                  : isRejected
                  ? 'border-rose-500 text-rose-500 ring-4 ring-rose-50'
                  : isLatest
                  ? 'border-teal-600 text-teal-600 ring-4 ring-teal-50'
                  : 'border-slate-300 text-slate-400'
              }`}
            >
              {isResolved ? (
                <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-50" />
              ) : isRejected ? (
                <XCircle className="w-3.5 h-3.5 fill-rose-50" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-current" />
              )}
            </div>

            {/* Timeline Item Content */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StatusBadge status={history.status} size="sm" />
                <span className="text-xs text-slate-400">
                  {new Date(history.created_at).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {history.notes && (
                <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                  {history.notes}
                </p>
              )}

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                {getActorIcon(history.actor_role)}
                <span>
                  Oleh: <strong className="text-slate-700">{history.actor_name || 'Sistem'}</strong>
                  {history.actor_role && (
                    <span className="ml-1 uppercase text-[10px] text-slate-400 font-semibold">
                      ({history.actor_role})
                    </span>
                  )}
                </span>
              </div>

              {/* Show Resolution Proof if available at RESOLVED step */}
              {isResolved && resolutionImage && (
                <div className="pt-2">
                  <p className="text-xs font-semibold text-emerald-800 mb-1.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Foto Bukti Penyelesaian Tugas Lapangan:
                  </p>
                  <div className="rounded-xl overflow-hidden border border-emerald-200 max-w-sm">
                    <img
                      src={resolutionImage.image_path}
                      alt="Bukti Selesai"
                      className="w-full h-44 object-cover"
                    />
                    {resolutionImage.caption && (
                      <p className="p-2 bg-emerald-50 text-[11px] text-emerald-800">
                        {resolutionImage.caption}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
