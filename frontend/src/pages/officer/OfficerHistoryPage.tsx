import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { officerService } from '../../services/officerService';
import { Report } from '../../types/report';
import { Card } from '../../components/common/Card';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { CheckCircle2, History, MapPin } from 'lucide-react';

export const OfficerHistoryPage: React.FC = () => {
  const [historyTasks, setHistoryTasks] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    officerService
      .getTasks({ status: 'RESOLVED' })
      .then((res) => setHistoryTasks(res.tasks.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Riwayat Tugas Selesai</h1>
        <p className="text-xs text-slate-500">Arsip seluruh laporan yang berhasil diselesaikan oleh unit kerja Anda</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Memuat riwayat...</div>
      ) : historyTasks.length === 0 ? (
        <EmptyState
          icon={<History className="w-10 h-10 text-slate-300" />}
          title="Belum Ada Riwayat Selesai"
          description="Tugas yang telah Anda selesaikan dan unggah foto buktinya akan tercatat secara permanen di sini."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {historyTasks.map((t) => (
            <Card key={t.id} className="p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">#{t.report_number}</span>
                <StatusBadge status={t.status} size="sm" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{t.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2">{t.description}</p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Selesai pada: {t.resolved_at ? new Date(t.resolved_at).toLocaleDateString('id-ID') : '-'}
                </span>
                <Link to={`/officer/tasks/${t.id}`} className="font-bold text-teal-600 hover:underline">
                  Lihat Arsip →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
