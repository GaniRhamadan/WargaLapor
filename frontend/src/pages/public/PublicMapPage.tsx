import React, { useEffect, useState } from 'react';
import { mapService } from '../../services/mapService';
import { reportService } from '../../services/reportService';
import { Report, ReportCategory } from '../../types/report';
import { ReportMap } from '../../components/maps/ReportMap';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Filter, Layers, MapPin, Search, Sparkles } from 'lucide-react';

export const PublicMapPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    reportService.getCategories().then((res) => setCategories(res.categories)).catch(() => {});
  }, []);

  const loadReports = () => {
    setLoading(true);
    mapService
      .getMapReports({
        category_id: selectedCategory ? Number(selectedCategory) : undefined,
        status: selectedStatus || undefined,
        priority: selectedPriority || undefined,
      })
      .then((res) => {
        let list = res.reports;
        if (searchQuery) {
          list = list.filter((r) =>
            r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.report_number.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        setReports(list);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReports();
  }, [selectedCategory, selectedStatus, selectedPriority]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Tagline */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Peta Laporan Publik
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Eksplorasi sebaran aduan fasilitas umum di seluruh penjuru kota secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
          <MapPin className="w-4 h-4 text-teal-600" />
          <span>Menampilkan {reports.length} Titik Laporan Terverifikasi</span>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari jalan, nomor laporan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadReports()}
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-slate-700 bg-white"
          >
            <option value="">Semua Kategori Masalah</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-slate-700 bg-white"
          >
            <option value="">Semua Status Pengerjaan</option>
            <option value="VERIFIED">Terverifikasi (Menunggu Petugas)</option>
            <option value="ASSIGNED">Petugas Ditugaskan</option>
            <option value="IN_PROGRESS">Sedang Dikerjakan</option>
            <option value="RESOLVED">Selesai Ditangani</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none text-slate-700 bg-white"
          >
            <option value="">Semua Tingkat Prioritas</option>
            <option value="CRITICAL">🔥 Kritis (Darurat)</option>
            <option value="HIGH">⚠️ Tinggi</option>
            <option value="MEDIUM">⏳ Sedang</option>
            <option value="LOW">✅ Rendah</option>
          </select>
        </div>
      </Card>

      {/* Main Map Box */}
      <ReportMap reports={reports} height="620px" />
    </div>
  );
};
