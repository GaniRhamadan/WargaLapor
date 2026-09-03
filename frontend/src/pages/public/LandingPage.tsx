import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../services/analyticsService';
import { reportService } from '../../services/reportService';
import { mapService } from '../../services/mapService';
import { Report, ReportCategory } from '../../types/report';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/common/StatCard';
import { ReportCard } from '../../components/reports/ReportCard';
import { ReportMap } from '../../components/maps/ReportMap';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck,
  Flame,
  HardHat,
  HeartHandshake,
  Layers,
  MapPin,
  PlusCircle,
  Shield,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_reports: 24,
    resolved_reports: 19,
    in_progress_reports: 4,
    average_satisfaction: 4.9,
    resolution_rate: 94.5,
  });
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [mapReports, setMapReports] = useState<Report[]>([]);

  useEffect(() => {
    analyticsService.getPublicStats().then((data) => {
      setStats((prev) => ({ ...prev, ...data }));
    }).catch(() => {});

    reportService.getCategories().then((data) => {
      setCategories(data.categories.slice(0, 8));
    }).catch(() => {});

    reportService.getReports({ scope: 'public', per_page: 3 }).then((data) => {
      setRecentReports(data.data);
    }).catch(() => {});

    mapService.getMapReports().then((data) => {
      setMapReports(data.reports.slice(0, 15));
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-900 text-white pt-16 pb-24 lg:pt-24 lg:pb-32">
        {/* Background gradient decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-linear-to-b from-teal-500/20 via-emerald-500/5 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Col: Hero Headline & CTA */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>Didukung Analisis AI & Geolokasi GPS Terintegrasi</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                Ada Masalah di Sekitarmu?{' '}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-400 via-emerald-400 to-cyan-300">
                  Laporkan Sekarang.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
                Platform Smart Citizen Reporting terpadu. Laporkan jalan berlubang, sampah menumpuk, lampu jalan padam, atau banjir. Pantau prosesnya secara transparan hingga tuntas.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link to={user ? '/citizen/create-report' : '/register'} className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    leftIcon={<PlusCircle className="w-5 h-5" />}
                    className="w-full shadow-lg shadow-teal-500/25 text-base"
                  >
                    Laporkan Masalah
                  </Button>
                </Link>

                <Link to="/public/how-it-works" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="w-full border-slate-700 text-slate-200 hover:bg-slate-800"
                  >
                    Lihat Cara Kerja
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 flex items-center justify-center lg:justify-start gap-8 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>100% Bebas Biaya</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-teal-400" />
                  <span>Analisis AI Akurat</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Respon SLA Terukur</span>
                </div>
              </div>
            </div>

            {/* Right Col: Hero Interactive Floating Preview */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl bg-slate-800/80 border border-slate-700/80 p-5 shadow-2xl backdrop-blur-xl space-y-4">
                {/* Floating Card Header */}
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-slate-400 ml-2">Live Monitoring Kota</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 animate-pulse">
                    ● AKTIF
                  </span>
                </div>

                {/* Sample Live Case Preview */}
                <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-700/60 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-teal-400 uppercase">#WL-2026-000001</span>
                      <h4 className="text-sm font-bold text-white mt-0.5">Lubang Jalan Protokol Sudirman</h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      KRITIS
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    AI Gemini mendeteksi kerusakan aspal membahayakan pengendara motor.
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800">
                    <span className="flex items-center gap-1 text-slate-300">
                      <HardHat className="w-3.5 h-3.5 text-amber-400" /> TRC Bina Marga
                    </span>
                    <span className="text-emerald-400 font-semibold">Sedang Dikerjakan</span>
                  </div>
                </div>

                {/* Mini Stats Grid */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50">
                    <p className="text-[10px] text-slate-400 font-medium">Tingkat Penyelesaian</p>
                    <p className="text-lg font-bold text-teal-400">{stats.resolution_rate}%</p>
                  </div>
                  <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/50">
                    <p className="text-[10px] text-slate-400 font-medium">Kepuasan Warga</p>
                    <p className="text-lg font-bold text-amber-400">★ {stats.average_satisfaction} / 5.0</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATISTIC SUMMARY CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Laporan Masuk"
            value={stats.total_reports}
            subtitle="Dari seluruh warga kota"
            icon={<FileCheck className="w-6 h-6" />}
            iconBgColor="bg-blue-50 text-blue-600"
          />
          <StatCard
            title="Laporan Selesai"
            value={stats.resolved_reports}
            subtitle="Telah diverifikasi & beres"
            icon={<CheckCircle2 className="w-6 h-6" />}
            iconBgColor="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            title="Sedang Ditangani"
            value={stats.in_progress_reports}
            subtitle="Petugas aktif di lapangan"
            icon={<HardHat className="w-6 h-6" />}
            iconBgColor="bg-amber-50 text-amber-600"
          />
          <StatCard
            title="Kepuasan Masyarakat"
            value={`${stats.average_satisfaction} / 5.0`}
            subtitle="Berdasarkan rating warga"
            icon={<HeartHandshake className="w-6 h-6" />}
            iconBgColor="bg-teal-50 text-teal-600"
          />
        </div>
      </section>

      {/* 3. CARA KERJA SISTEM */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
            Alur Mudah & Transparan
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Bagaimana WargaLapor Bekerja?
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Hanya butuh 4 langkah mudah untuk melaporkan masalah di sekitar Anda dan memantau perkembangannya hingga selesai diperbaiki.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {[
            {
              step: '01',
              title: 'Foto & Tentukan Lokasi',
              desc: 'Ambil foto masalah di lapangan. Sistem otomatis membaca koordinat GPS Anda.',
              icon: <MapPin className="w-6 h-6 text-teal-600" />,
            },
            {
              step: '02',
              title: 'Analisis Otomatis AI',
              desc: 'AI Gemini menganalisis tingkat keparahan, urgensi, dan mengecek duplikasi laporan.',
              icon: <Bot className="w-6 h-6 text-blue-600" />,
            },
            {
              step: '03',
              title: 'Petugas Lapangan Diterjunkan',
              desc: 'Admin memverifikasi dan menugaskan satuan tugas resmi sesuai wilayah masalah.',
              icon: <HardHat className="w-6 h-6 text-amber-600" />,
            },
            {
              step: '04',
              title: 'Selesai & Beri Rating',
              desc: 'Petugas mengunggah foto bukti penyelesaian. Warga menerima notifikasi dan memberi ulasan.',
              icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
            },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative space-y-4">
              <span className="text-3xl font-black text-slate-200">{item.step}</span>
              <div className="p-3 w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                {item.icon}
              </div>
              <h4 className="text-base font-bold text-slate-900">{item.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. KATEGORI MASALAH PUBLIK */}
      <section className="bg-slate-100/70 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                Cakupan Aduan
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Kategori Masalah yang Dapat Dilaporkan
              </h2>
            </div>
            <Link to="/citizen/create-report" className="text-xs font-bold text-teal-600 hover:text-teal-700">
              Lihat Semua Kategori →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/public/map?category_id=${cat.id}`}
                className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-teal-300 hover:shadow-md transition-all group flex flex-col justify-between space-y-3"
              >
                <div
                  style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                    {cat.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {cat.description || 'Laporan fasilitas kota'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PETA LAPORAN PUBLIK PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
              Geospasial Transparan
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Peta Sebaran Laporan Terkini
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Pantau titik aduan yang sedang aktif dan telah selesai di sekitar wilayah Anda.
            </p>
          </div>
          <Link to="/public/map">
            <Button variant="outline" size="sm" rightIcon={<Compass className="w-4 h-4" />}>
              Buka Peta Interaktif Lengkap
            </Button>
          </Link>
        </div>

        <ReportMap reports={mapReports} height="440px" />
      </section>

      {/* 6. AI FEATURES HIGHLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-linear-to-r from-teal-900 via-slate-900 to-slate-950 text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold">
                <Bot className="w-4 h-4" />
                <span>Teknologi Kecerdasan Buatan</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                AI Cerdas untuk Klasifikasi & Respon Cepat
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Setiap laporan yang masuk secara otomatis dianalisis oleh Gemini AI untuk mengevaluasi tingkat keparahan, menentukan prioritas penanganan (Kritis, Tinggi, Sedang, Rendah), dan mendeteksi laporan ganda agar tidak ada tugas yang terduplikasi.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                <div className="flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Estimasi keparahan otomatis dalam hitungan detik</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>Deteksi duplikasi spasial dalam radius 600m</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold text-teal-300">Hasil Analisis AI Contoh</span>
                <span className="text-[10px] bg-teal-400/20 text-teal-200 px-2 py-0.5 rounded-full font-bold">
                  Confidence 95%
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tingkat Keparahan:</span>
                  <span className="font-bold text-rose-400">HIGH (Prioritas Tinggi)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SLA Rekomendasi:</span>
                  <span className="font-bold text-white">Maksimal 12 Jam</span>
                </div>
                <div className="p-3 bg-black/30 rounded-xl text-slate-300 text-[11px] leading-relaxed">
                  "Jalan berlubang pada jalur padat mobilitas warga. Direkomendasikan penambalan hotmix cepat dan pemasangan rambu peringatan sementara."
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CTA SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Bersama Wujudkan Lingkungan Kota yang Lebih Nyaman
        </h2>
        <p className="text-slate-500 text-sm max-w-xl mx-auto">
          Setiap laporan Anda adalah langkah nyata untuk perbaikan fasilitas umum dan masa depan kota yang lebih baik.
        </p>
        <div className="pt-2 flex items-center justify-center gap-4">
          <Link to="/register">
            <Button variant="primary" size="lg" leftIcon={<PlusCircle className="w-5 h-5" />}>
              Daftar & Mulai Lapor
            </Button>
          </Link>
          <Link to="/public/map">
            <Button variant="outline" size="lg">
              Jelajahi Peta
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};
