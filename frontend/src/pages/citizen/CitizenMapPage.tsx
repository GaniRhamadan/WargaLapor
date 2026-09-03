import React, { useEffect, useState } from 'react';
import { mapService } from '../../services/mapService';
import { reportService } from '../../services/reportService';
import { Report, ReportCategory } from '../../types/report';
import { ReportMap } from '../../components/maps/ReportMap';
import { Card } from '../../components/common/Card';
import { MapPin, Search } from 'lucide-react';

export const CitizenMapPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  useEffect(() => {
    reportService.getCategories().then((res) => setCategories(res.categories));
  }, []);

  useEffect(() => {
    mapService
      .getMapReports({
        category_id: selectedCat ? Number(selectedCat) : undefined,
        status: selectedStatus || undefined,
      })
      .then((res) => setReports(res.reports));
  }, [selectedCat, selectedStatus]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Peta Laporan Sekitar
        </h1>
        <p className="text-xs text-slate-500">
          Lihat sebaran titik laporan aduan warga yang aktif di sekitar lingkungan Anda
        </p>
      </div>

      <Card className="p-4 flex flex-wrap gap-3">
        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="text-xs px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
        >
          <option value="">Semua Status</option>
          <option value="SUBMITTED">Menunggu Verifikasi</option>
          <option value="VERIFIED">Terverifikasi</option>
          <option value="IN_PROGRESS">Sedang Dikerjakan</option>
          <option value="RESOLVED">Selesai</option>
        </select>
      </Card>

      <ReportMap reports={reports} height="580px" />
    </div>
  );
};
