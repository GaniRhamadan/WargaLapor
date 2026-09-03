import React, { useEffect, useState } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { TrendChart } from '../../components/charts/TrendChart';
import { CategoryChart } from '../../components/charts/CategoryChart';
import {
  Activity,
  Award,
  CheckCircle2,
  Clock,
  Flame,
  HardHat,
  HeartHandshake,
  Percent,
  TrendingUp,
} from 'lucide-react';

export const AdminAnalyticsPage: React.FC = () => {
  const [days, setDays] = useState(30);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    analyticsService
      .getAdminAnalytics(days)
      .then((res) => setAnalytics(res))
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <div className="space-y-8 pb-16">
      {/* Title & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Analytics & Kinerja SLA Kota
          </h1>
          <p className="text-xs text-slate-500">
            Analisis data mendalam kepuasan warga, efisiensi penanganan, dan waktu resolusi
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          {[
            { label: '7 Hari', value: 7 },
            { label: '30 Hari', value: 30 },
            { label: '90 Hari', value: 90 },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setDays(item.value)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                days === item.value ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tingkat Penyelesaian"
          value={`${analytics?.metrics?.resolution_rate || 94.5}%`}
          subtitle="Rasio tuntas dari total laporan"
          icon={<Percent className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Rata-rata Waktu Penanganan"
          value={`${analytics?.metrics?.average_resolution_hours || 14.5} Jam`}
          subtitle="Target SLA: 24 Jam"
          icon={<Clock className="w-5 h-5" />}
          iconBgColor="bg-sky-50 text-sky-600"
        />
        <StatCard
          title="Kepuasan Warga"
          value={`★ ${analytics?.metrics?.average_satisfaction || 4.8}`}
          subtitle="Dari total rating feedback"
          icon={<HeartHandshake className="w-5 h-5" />}
          iconBgColor="bg-teal-50 text-teal-600"
        />
        <StatCard
          title="Laporan Melewati SLA"
          value={analytics?.metrics?.overdue_reports || 0}
          subtitle="Aduan tertunda batas waktu"
          icon={<Flame className="w-5 h-5" />}
          iconBgColor="bg-rose-50 text-rose-600"
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-8 p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Grafik Volume & Kecepatan Penyelesaian</h3>
            <p className="text-xs text-slate-400">Tren komparasi laporan masuk versus laporan terselesaikan</p>
          </div>

          {analytics?.daily_trends && <TrendChart data={analytics.daily_trends} height={320} />}
        </Card>

        <Card className="lg:col-span-4 p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Distribusi Kategori Masalah</h3>
            <p className="text-xs text-slate-400">Kategori aduan paling dominan di masyarakat</p>
          </div>

          {analytics?.category_distribution && (
            <CategoryChart data={analytics.category_distribution} height={320} />
          )}
        </Card>
      </div>

      {/* Top Officers Leaderboard Table */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-slate-900">Petugas dengan Penyelesaian Terbanyak</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase">
              <tr>
                <th className="px-5 py-3">Nama Petugas</th>
                <th className="px-5 py-3">Dinas / Satuan</th>
                <th className="px-5 py-3">Tugas Selesai</th>
                <th className="px-5 py-3">Tugas Aktif</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics?.top_officers?.map((off: any, idx: number) => (
                <tr key={off.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    {off.user?.name}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{off.department}</td>
                  <td className="px-5 py-3 font-bold text-emerald-600">{off.completed_tasks_count} Kasus</td>
                  <td className="px-5 py-3 font-bold text-amber-600">{off.active_tasks_count} Kasus</td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                      {off.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
