import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { officerService } from '../../services/officerService';
import { Report } from '../../types/report';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flame,
  HardHat,
  MapPin,
  PlayCircle,
  Sparkles,
} from 'lucide-react';

export const OfficerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Report[]>([]);
  const [stats, setStats] = useState<any>({
    total_assigned: 0,
    in_progress: 0,
    resolved: 0,
    urgent: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    officerService
      .getTasks()
      .then((res) => {
        setTasks(res.tasks.data);
        setStats(res.stats);
      })
      .finally(() => setLoading(false));
  }, []);

  const urgentTasks = tasks.filter(
    (t) => (t.priority === 'CRITICAL' || t.priority === 'HIGH') && t.status !== 'RESOLVED' && t.status !== 'CLOSED'
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Officer Header */}
      <div className="rounded-3xl bg-linear-to-r from-amber-700 via-amber-800 to-slate-900 text-white p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-amber-200 text-xs font-semibold">
              <HardHat className="w-3.5 h-3.5" />
              <span>{user?.officer_profile?.department || 'Satuan Tugas Lapangan'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Selamat Bertugas, {user?.name}! 👷
            </h1>
            <p className="text-xs sm:text-sm text-amber-100 max-w-xl">
              Unit: {user?.officer_profile?.unit || 'Tim Reaksi Cepat'} • Wilayah:{' '}
              {user?.officer_profile?.area_coverage || 'Jakarta'}
            </p>
          </div>

          <Link to="/officer/tasks">
            <Button variant="secondary" size="md" className="bg-slate-900 text-amber-300 font-bold border border-amber-500/30">
              Lihat Semua Tugas
            </Button>
          </Link>
        </div>
      </div>

      {/* Officer KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tugas Ditugaskan"
          value={stats.total_assigned}
          subtitle="Total penugasan aktif"
          icon={<HardHat className="w-5 h-5" />}
          iconBgColor="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Sedang Dikerjakan"
          value={stats.in_progress}
          subtitle="Progres di lapangan"
          icon={<PlayCircle className="w-5 h-5" />}
          iconBgColor="bg-sky-50 text-sky-600"
        />
        <StatCard
          title="Selesai Diperbaiki"
          value={stats.resolved}
          subtitle="Tuntas terverifikasi"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Prioritas Tinggi / Kritis"
          value={stats.urgent}
          subtitle="Membutuhkan tindakan cepat"
          icon={<Flame className="w-5 h-5" />}
          iconBgColor="bg-rose-50 text-rose-600"
        />
      </div>

      {/* Urgent Tasks Alert Section */}
      {urgentTasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
            <Flame className="w-4 h-4 animate-bounce" />
            <h3>Tugas Prioritas Kritis & Tinggi Membutuhkan Tindakan Segera</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {urgentTasks.map((task) => (
              <Card key={task.id} className="p-5 border-rose-200 bg-rose-50/30 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-rose-700">#{task.report_number}</span>
                  <PriorityBadge priority={task.priority} size="sm" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{task.title}</h4>
                <p className="text-xs text-slate-600 line-clamp-2">{task.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-rose-100 text-xs">
                  <span className="flex items-center gap-1 text-slate-500 truncate max-w-[200px]">
                    <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    {task.address}
                  </span>
                  <Link to={`/officer/tasks/${task.id}`}>
                    <Button variant="danger" size="sm">
                      Buka Tugas →
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Assigned Tasks List */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Daftar Tugas Aktif Terbaru</h3>
          <Link to="/officer/tasks" className="text-xs font-bold text-teal-600 hover:text-teal-700">
            Lihat Semua →
          </Link>
        </div>

        {tasks.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">
            Tidak ada tugas aktif yang sedang ditugaskan.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">#{task.report_number}</span>
                    <PriorityBadge priority={task.priority} size="sm" />
                    <StatusBadge status={task.status} size="sm" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{task.title}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    {task.address}
                  </p>
                </div>

                <Link to={`/officer/tasks/${task.id}`} className="shrink-0">
                  <Button variant="outline" size="sm">
                    Detail & Update Status
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
