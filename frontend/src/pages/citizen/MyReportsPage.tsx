import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportService } from '../../services/reportService';
import { Report } from '../../types/report';
import { ReportCard } from '../../components/reports/ReportCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { ReportCardSkeleton } from '../../components/common/SkeletonLoader';
import { PlusCircle, Search, Filter } from 'lucide-react';

export const MyReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const fetchReports = () => {
    setLoading(true);
    reportService
      .getReports({
        scope: 'my',
        status: statusFilter || undefined,
        search: search || undefined,
      })
      .then((res) => setReports(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Laporan Saya
          </h1>
          <p className="text-xs text-slate-500">
            Daftar seluruh aduan fasilitas umum yang pernah Anda kirimkan
          </p>
        </div>

        <Link to="/citizen/create-report">
          <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
            Buat Laporan Baru
          </Button>
        </Link>
      </div>

      {/* Filter Tabs & Search */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {[
              { label: 'Semua', value: '' },
              { label: 'Menunggu', value: 'SUBMITTED' },
              { label: 'Terverifikasi', value: 'VERIFIED' },
              { label: 'Diproses', value: 'IN_PROGRESS' },
              { label: 'Selesai', value: 'RESOLVED' },
              { label: 'Ditolak', value: 'REJECTED' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.value
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari judul / nomor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchReports()}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
        </div>
      </Card>

      {/* Report Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ReportCardSkeleton />
          <ReportCardSkeleton />
          <ReportCardSkeleton />
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          title="Tidak Ada Laporan Ditemukan"
          description="Anda belum memiliki laporan dengan filter ini. Mulai laporkan masalah di sekitar Anda."
          actionText="Buat Laporan Baru"
          onAction={() => {}}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} detailUrl={`/citizen/reports/${report.id}`} />
          ))}
        </div>
      )}
    </div>
  );
};
