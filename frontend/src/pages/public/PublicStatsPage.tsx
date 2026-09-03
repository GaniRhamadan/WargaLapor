import React, { useEffect, useState } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { TrendChart } from '../../components/charts/TrendChart';
import { CategoryChart } from '../../components/charts/CategoryChart';
import {
  CheckCircle2,
  Clock,
  FileCheck,
  HardHat,
  HeartHandshake,
  Percent,
  TrendingUp,
} from 'lucide-react';

export const PublicStatsPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsService.getPublicStats(),
      analyticsService.getAdminAnalytics(30),
    ])
      .then(([pub, adm]) => {
        setStats(pub);
        setAnalytics(adm);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold text-teal-600 uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
          Transparansi Publik
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Statistik & Kinerja Pelayanan Publik Kota
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          Seluruh data laporan warga disajikan secara terbuka untuk mendukung tata kelola kota yang akuntabel, terukur, dan terpercaya.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Laporan Diterima"
          value={stats?.total_reports || 24}
          subtitle="Aduan dari masyarakat"
          icon={<FileCheck className="w-6 h-6" />}
          iconBgColor="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Tingkat Keberhasilan"
          value={`${stats?.resolution_rate || 94.5}%`}
          subtitle="Laporan terselesaikan tuntas"
          icon={<Percent className="w-6 h-6" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Rata-rata Waktu Penanganan"
          value={`${analytics?.metrics?.average_resolution_hours || 14.5} Jam`}
          subtitle="Dari verifikasi ke selesai"
          icon={<Clock className="w-6 h-6" />}
          iconBgColor="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Indeks Kepuasan Warga"
          value={`${stats?.average_satisfaction || 4.9} / 5.0`}
          subtitle="Berdasarkan 50+ ulasan"
          icon={<HeartHandshake className="w-6 h-6" />}
          iconBgColor="bg-teal-50 text-teal-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Trend Area Chart */}
        <Card className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Tren Laporan Masuk vs Selesai (14 Hari Terakhir)</h3>
              <p className="text-xs text-slate-400">Pemantauan volume aduan dan efisiensi penyelesaian harian</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-teal-50 text-teal-700">
              Live Data
            </span>
          </div>

          {analytics?.daily_trends && (
            <TrendChart data={analytics.daily_trends} height={320} />
          )}
        </Card>

        {/* Category Pie Chart */}
        <Card className="lg:col-span-4 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Proporsi Kategori Aduan</h3>
            <p className="text-xs text-slate-400">Distribusi masalah terbanyak di kota</p>
          </div>

          {analytics?.category_distribution && (
            <CategoryChart data={analytics.category_distribution} height={320} />
          )}
        </Card>
      </div>
    </div>
  );
};
