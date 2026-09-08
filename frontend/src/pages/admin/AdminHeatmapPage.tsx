import React, { useEffect, useState } from 'react';
import { mapService, HeatmapResponse } from '../../services/mapService';
import { reportService } from '../../services/reportService';
import { ReportCategory } from '../../types/report';
import { HeatmapView } from '../../components/maps/HeatmapView';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import {
  Flame,
  Filter,
  AlertTriangle,
  RotateCcw,
  Sliders,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Eye,
  Navigation,
  Sparkles,
} from 'lucide-react';

export const AdminHeatmapPage: React.FC = () => {
  const [heatmapData, setHeatmapData] = useState<HeatmapResponse>({
    points: [],
    detail_points: [],
    stats: { total: 0, critical_count: 0, high_count: 0, active_count: 0 },
    hotspots: [],
  });
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ACTIVE');
  const [selectedPriority, setSelectedPriority] = useState('');

  // Map visualization state
  const [radius, setRadius] = useState(36);
  const [showPoints, setShowPoints] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.2088, 106.8227]);
  const [mapZoom, setMapZoom] = useState(12);

  // Fetch categories on mount
  useEffect(() => {
    reportService
      .getCategories()
      .then((res) => setCategories(res.categories))
      .catch((err) => console.error('Failed to fetch categories:', err));
  }, []);

  // Fetch heatmap data when filters change
  useEffect(() => {
    setLoading(true);
    mapService
      .getHeatmapPoints({
        category_id: selectedCat ? Number(selectedCat) : undefined,
        status: selectedStatus || undefined,
        priority: selectedPriority || undefined,
      })
      .then((res) => {
        setHeatmapData(res);
      })
      .catch((err) => {
        console.error('Failed to fetch heatmap points:', err);
      })
      .finally(() => setLoading(false));
  }, [selectedCat, selectedStatus, selectedPriority]);

  const handleResetFilters = () => {
    setSelectedCat('');
    setSelectedStatus('ACTIVE');
    setSelectedPriority('');
    setRadius(36);
    setShowPoints(false);
    setMapCenter([-6.2088, 106.8227]);
    setMapZoom(12);
  };

  const handleFocusHotspot = (lat: number, lng: number) => {
    setMapCenter([lat, lng]);
    setMapZoom(15);
  };

  const stats = heatmapData.stats || { total: 0, critical_count: 0, high_count: 0, active_count: 0 };
  const hotspots = heatmapData.hotspots || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 shadow-xs">
              <Flame className="w-6 h-6 text-rose-600 animate-pulse" />
            </div>
            Heatmap Konsentrasi Masalah Masyarakat
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pemodelan spasial kepadatan aduan warga secara waktu nyata (real-time) untuk penentuan prioritas intervensi anggaran & dinas teknis
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Peta & Filter
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Titik Aduan</span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <MapPin className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
            <span className="text-[11px] text-slate-500">lokasi terpantau</span>
          </div>
        </Card>

        <Card className="p-4 bg-rose-50/50 border border-rose-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">Konsentrasi Kritis</span>
            <span className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">{stats.critical_count}</span>
            <span className="text-[11px] text-rose-600/80">butuh aksi cepat</span>
          </div>
        </Card>

        <Card className="p-4 bg-amber-50/50 border border-amber-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Prioritas Tinggi</span>
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{stats.high_count}</span>
            <span className="text-[11px] text-amber-600/80">tingkat waspada</span>
          </div>
        </Card>

        <Card className="p-4 bg-teal-50/50 border border-teal-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-700">Belum Selesai (Aktif)</span>
            <span className="p-1.5 rounded-lg bg-teal-100 text-teal-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-teal-600">{stats.active_count}</span>
            <span className="text-[11px] text-teal-600/80">sedang ditangani</span>
          </div>
        </Card>
      </div>

      {/* Filter & Customization Toolbar */}
      <Card className="p-4 bg-white border border-slate-200 space-y-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Filter className="w-3.5 h-3.5 text-teal-600" />
              <span>Filter:</span>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all font-medium text-slate-700"
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
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all font-medium text-slate-700"
            >
              <option value="ACTIVE">Status: Laporan Aktif Sahaja</option>
              <option value="">Status: Semua Laporan (Termasuk Selesai)</option>
              <option value="RESOLVED">Status: Hanya Laporan Selesai</option>
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none transition-all font-medium text-slate-700"
            >
              <option value="">Semua Tingkat Prioritas</option>
              <option value="CRITICAL">Hanya Prioritas Kritis (Merah)</option>
              <option value="HIGH">Prioritas Tinggi (Oranye)</option>
              <option value="MEDIUM">Prioritas Sedang (Kuning)</option>
              <option value="LOW">Prioritas Rendah (Biru)</option>
            </select>
          </div>

          {/* Visualization Controls */}
          <div className="flex flex-wrap items-center gap-4 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            {/* Radius Slider */}
            <div className="flex items-center gap-2 text-xs">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-600 font-medium whitespace-nowrap">Radius Panas:</span>
              <input
                type="range"
                min="20"
                max="55"
                step="2"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-24 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <span className="text-[11px] font-bold text-slate-700 w-7">{radius}px</span>
            </div>

            {/* Marker Toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={showPoints}
                onChange={(e) => setShowPoints(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
              />
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                Titik Aduan
              </span>
            </label>
          </div>
        </div>
      </Card>

      {/* Main Map + Hotspots Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Heatmap (takes 3 cols on large screen) */}
        <div className="lg:col-span-3 space-y-4">
          <HeatmapView
            points={heatmapData.points}
            detailPoints={heatmapData.detail_points}
            showPoints={showPoints}
            radius={radius}
            center={mapCenter}
            zoom={mapZoom}
            height="580px"
          />

          <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 flex items-center justify-between text-xs gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong className="text-white">Tip Analisis:</strong> Area berwarna <strong>Merah Pekat</strong> menandakan akumulasi titik aduan yang berdekatan atau masalah berprioritas kritis. Klik salah satu kartu hotspot untuk langsung memperbesar peta ke kawasan tersebut.
              </span>
            </div>
            {mapZoom > 12 && (
              <button
                onClick={() => {
                  setMapCenter([-6.2088, 106.8227]);
                  setMapZoom(12);
                }}
                className="text-[11px] text-teal-300 hover:text-teal-200 underline whitespace-nowrap cursor-pointer"
              >
                Reset Tampilan Kota
              </button>
            )}
          </div>
        </div>

        {/* Hotspots Sidebar (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-500" />
              Top Hotspot Terpadat
            </h2>
            <span className="text-[10px] text-slate-400 font-semibold">KLUSTER ADUAN</span>
          </div>

          {hotspots.length === 0 ? (
            <Card className="p-6 text-center text-xs text-slate-400">
              Tidak ada hotspot terdeteksi untuk kombinasi filter saat ini.
            </Card>
          ) : (
            <div className="space-y-3">
              {hotspots.map((h, i) => {
                const isCritical = h.level === 'KRITIS';
                const isHigh = h.level === 'TINGGI';

                return (
                  <Card
                    key={i}
                    className={`p-3.5 border transition-all hover:shadow-md cursor-pointer ${
                      isCritical
                        ? 'border-rose-200 bg-rose-50/30 hover:border-rose-300'
                        : isHigh
                        ? 'border-amber-200 bg-amber-50/20 hover:border-amber-300'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                    onClick={() => handleFocusHotspot(h.lat, h.lng)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isCritical ? 'bg-rose-500 animate-ping' : isHigh ? 'bg-amber-500' : 'bg-blue-500'
                            }`}
                          />
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                              isCritical
                                ? 'bg-rose-100 text-rose-700'
                                : isHigh
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            Hotspot {h.level}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-xs mt-1.5 line-clamp-1">{h.name}</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Kategori Utama: <span className="font-medium text-slate-700">{h.top_category}</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-slate-900">{h.count}</span>
                        <p className="text-[10px] text-slate-400">laporan</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-mono">
                        {h.lat.toFixed(3)}, {h.lng.toFixed(3)}
                      </span>
                      <span className="text-teal-600 font-bold flex items-center gap-1 hover:underline">
                        <Navigation className="w-3 h-3" />
                        Fokus Peta &rarr;
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
