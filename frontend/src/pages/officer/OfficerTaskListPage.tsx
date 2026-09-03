import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { officerService } from '../../services/officerService';
import { Report } from '../../types/report';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { HardHat, MapPin, PlayCircle, Search, Filter } from 'lucide-react';

export const OfficerTaskListPage: React.FC = () => {
  const [tasks, setTasks] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const fetchTasks = () => {
    setLoading(true);
    officerService
      .getTasks({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      })
      .then((res) => setTasks(res.tasks.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tugas Lapangan Saya</h1>
        <p className="text-xs text-slate-500">Kelola dan update status penanganan aduan masyarakat di lapangan</p>
      </div>

      {/* Filter Tabs */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { label: 'Semua Tugas', value: '' },
            { label: 'Ditugaskan (Baru)', value: 'ASSIGNED' },
            { label: 'Sedang Dikerjakan', value: 'IN_PROGRESS' },
            { label: 'Menunggu Kondisi', value: 'WAITING' },
            { label: 'Selesai', value: 'RESOLVED' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === tab.value
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
        >
          <option value="">Semua Prioritas</option>
          <option value="CRITICAL">Kritis</option>
          <option value="HIGH">Tinggi</option>
          <option value="MEDIUM">Sedang</option>
          <option value="LOW">Rendah</option>
        </select>
      </Card>

      {/* Tasks Table / Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Memuat daftar tugas...</div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<HardHat className="w-10 h-10 text-slate-300" />}
          title="Tidak Ada Tugas Aktif"
          description="Saat ini belum ada tugas baru yang ditugaskan kepada Anda sesuai kriteria filter."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tasks.map((task) => (
            <Card key={task.id} hoverEffect className="p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">#{task.report_number}</span>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={task.priority} size="sm" />
                    <StatusBadge status={task.status} size="sm" />
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 line-clamp-1">{task.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{task.description}</p>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                  <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="truncate">{task.address}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Pelapor: {task.user?.name || 'Warga'} ({task.user?.phone || '08xx'})
                </span>
                <Link to={`/officer/tasks/${task.id}`}>
                  <Button variant="primary" size="sm">
                    Tindak Lanjuti →
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
