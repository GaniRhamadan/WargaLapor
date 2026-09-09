import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { reportService } from '../../services/reportService';
import { mapService } from '../../services/mapService';
import { Report } from '../../types/report';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ReportCard } from '../../components/reports/ReportCard';
import { ReportMap } from '../../components/maps/ReportMap';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  HardHat,
  PlusCircle,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [nearbyReports, setNearbyReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      reportService.getReports({ scope: 'my', per_page: 4 }),
      mapService.getMapReports(),
    ])
      .then(([resMy, resMap]) => {
        if (!isMounted) return;
        const myData = Array.isArray(resMy?.data) ? resMy.data : (Array.isArray(resMy) ? resMy : []);
        const nearbyData = Array.isArray(resMap?.reports) ? resMap.reports : (Array.isArray(resMap) ? resMap : []);
        setMyReports(myData);
        setNearbyReports(nearbyData.slice(0, 10));
      })
      .catch((err) => {
        console.error('Error loading citizen dashboard data:', err);
        if (isMounted) {
          setMyReports([]);
          setNearbyReports([]);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const safeMyReports = Array.isArray(myReports) ? myReports : [];
  const safeNearbyReports = Array.isArray(nearbyReports) ? nearbyReports : [];

  const totalMy = safeMyReports.length;
  const pendingMy = safeMyReports.filter((r) => r && (r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW')).length;
  const inProgressMy = safeMyReports.filter((r) => r && (r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS' || r.status === 'WAITING')).length;
  const resolvedMy = safeMyReports.filter((r) => r && (r.status === 'RESOLVED' || r.status === 'CLOSED')).length;

  return (
    <div className="space-y-8">
      {/* 1. Welcome Banner & CTA */}
      <div className="rounded-3xl bg-linear-to-r from-teal-700 via-teal-800 to-slate-900 text-white p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-teal-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Portal Pelayanan Warga Cerdas</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Halo, {user?.name || 'Warga'}!
            </h1>
            <p className="text-xs sm:text-sm text-teal-100 max-w-xl leading-relaxed">
              Ada fasilitas umum yang rusak, jalan berlubang, atau sampah liar di sekitar Anda? Laporkan sekarang agar segera ditangani dinas terkait.
            </p>
          </div>

          <Link to="/citizen/create-report" className="shrink-0">
            <Button
              variant="success"
              size="lg"
              leftIcon={<PlusCircle className="w-5 h-5" />}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold shadow-lg"
            >
              Buat Laporan Baru
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. My Reports Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Laporan Saya"
          value={totalMy}
          subtitle="Semua aduan terkirim"
          icon={<FileText className="w-5 h-5" />}
          iconBgColor="bg-teal-50 text-teal-600"
        />
        <StatCard
          title="Menunggu Verifikasi"
          value={pendingMy}
          subtitle="Dalam antrean admin"
          icon={<Clock className="w-5 h-5" />}
          iconBgColor="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Sedang Dikerjakan"
          value={inProgressMy}
          subtitle="Petugas di lapangan"
          icon={<HardHat className="w-5 h-5" />}
          iconBgColor="bg-sky-50 text-sky-600"
        />
        <StatCard
          title="Telah Selesai"
          value={resolvedMy}
          subtitle="Tuntas diperbaiki"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* 3. Recent Reports by Citizen */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Laporan Terbaru Saya</h2>
            <p className="text-xs text-slate-500">Pantau progres tindak lanjut aduan yang pernah Anda kirimkan</p>
          </div>
          <Link to="/citizen/reports" className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">
            Semua Laporan <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {safeMyReports.length === 0 ? (
          <Card className="text-center py-10 space-y-3">
            <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Belum Ada Laporan</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Anda belum pernah membuat laporan aduan. Temukan masalah di sekitar dan jadilah pelapor pertama!
            </p>
            <Link to="/citizen/create-report">
              <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                Buat Laporan Sekarang
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeMyReports.slice(0, 3).map((rep) => (
              <ReportCard key={rep.id} report={rep} detailUrl={`/citizen/reports/${rep.id}`} />
            ))}
          </div>
        )}
      </div>

      {/* 4. Nearby City Reports Map */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Peta Laporan Sekitar</h2>
            <p className="text-xs text-slate-500">Titik aduan fasilitas publik yang sedang aktif di wilayah kota</p>
          </div>
          <Link to="/citizen/map" className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">
            Buka Peta Lengkap <Compass className="w-3.5 h-3.5" />
          </Link>
        </div>

        <ReportMap reports={safeNearbyReports} height="380px" />
      </div>
    </div>
  );
};
