import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { analyticsService } from '../../services/analyticsService';
import { Report } from '../../types/report';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { TrendChart } from '../../components/charts/TrendChart';
import { CategoryChart } from '../../components/charts/CategoryChart';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock,
  FileCheck,
  Flame,
  HardHat,
  Shield,
  Users,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({
    total: 0,
    pending_verification: 0,
    in_progress: 0,
    resolved: 0,
    critical: 0,
  });
  const [pendingReports, setPendingReports] = useState<Report[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminService.getReports({ verification_status: 'PENDING', per_page: 5 }),
      analyticsService.getAdminAnalytics(30),
    ])
      .then(([resReports, resAnalytics]) => {
        if (resReports?.stats) {
          setStats(resReports.stats);
        }
        const pending = Array.isArray(resReports?.reports?.data)
          ? resReports.reports.data
          : Array.isArray(resReports?.reports)
            ? resReports.reports
            : [];
        setPendingReports(pending);
        setAnalytics(resAnalytics || null);
      })
      .catch((err) => {
        console.error('Error fetching admin dashboard data:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 pb-16">
      {/* Admin Top Headline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Dashboard Utama Administrator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Monitoring sentral operasional aduan, performa SLA, dan penugasan petugas kota
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/verification">
            <Button variant="primary" size="md" leftIcon={<FileCheck className="w-4 h-4" />}>
              Verifikasi Aduan Masuk ({stats.pending_verification})
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Laporan"
          value={stats.total}
          subtitle="Database keseluruhan"
          icon={<Activity className="w-5 h-5" />}
          iconBgColor="bg-slate-100 text-slate-700"
        />
        <StatCard
          title="Menunggu Verifikasi"
          value={stats.pending_verification}
          subtitle="Perlu review admin"
          icon={<FileCheck className="w-5 h-5" />}
          iconBgColor="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Sedang Diproses"
          value={stats.in_progress}
          subtitle="Petugas di lapangan"
          icon={<HardHat className="w-5 h-5" />}
          iconBgColor="bg-sky-50 text-sky-600"
        />
        <StatCard
          title="Telah Selesai"
          value={stats.resolved}
          subtitle="Tuntas terverifikasi"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Aduan Kritis"
          value={stats.critical}
          subtitle="Prioritas darurat"
          icon={<Flame className="w-5 h-5" />}
          iconBgColor="bg-rose-50 text-rose-600"
        />
      </div>

      {/* Verification Action Queue */}
      {stats.pending_verification > 0 && (
        <Card className="p-6 border-amber-200 bg-amber-50/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <h3>Antrean Verifikasi Mendesak ({stats.pending_verification} Laporan)</h3>
            </div>
            <Link to="/admin/verification" className="text-xs font-bold text-teal-700 hover:underline">
              Buka Semua Antrean →
            </Link>
          </div>

          <div className="divide-y divide-amber-100">
            {pendingReports.map((r) => (
              <div key={r.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">#{r.report_number}</span>
                    <PriorityBadge priority={r.priority} size="sm" />
                    <span className="text-[10px] text-slate-400 font-medium">{r.address}</span>
                  </div>
                  <h4 className="font-bold text-slate-900">{r.title}</h4>
                </div>

                <Link to="/admin/verification" className="shrink-0">
                  <Button variant="primary" size="sm">
                    Tinjau & Verifikasi
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-8 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Tren Laporan Masuk vs Selesai (30 Hari)</h3>
              <p className="text-xs text-slate-400">Tingkat efisiensi respon penanganan dinas teknis</p>
            </div>
            <Link to="/admin/analytics" className="text-xs font-bold text-teal-600 hover:underline">
              Detail Analytics →
            </Link>
          </div>

          {analytics?.daily_trends && <TrendChart data={analytics.daily_trends} height={300} />}
        </Card>

        <Card className="lg:col-span-4 p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Sebaran Kategori Masalah</h3>
            <p className="text-xs text-slate-400">Komposisi aduan per kategori dinas</p>
          </div>

          {analytics?.category_distribution && (
            <CategoryChart data={analytics.category_distribution} height={300} />
          )}
        </Card>
      </div>
    </div>
  );
};
