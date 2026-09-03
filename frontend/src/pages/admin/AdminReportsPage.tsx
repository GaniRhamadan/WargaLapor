import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { reportService } from '../../services/reportService';
import { Officer } from '../../types/officer';
import { Report, ReportCategory } from '../../types/report';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import {
  HardHat,
  MapPin,
  Search,
  UserCheck,
  Filter,
  Sliders,
  CheckCircle2,
  Calendar,
  Eye,
} from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');

  // Assign Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedOfficerId, setSelectedOfficerId] = useState<number | null>(null);
  const [assignNotes, setAssignNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchReports = () => {
    setLoading(true);
    adminService
      .getReports({
        status: status || undefined,
        priority: priority || undefined,
        category_id: categoryId ? Number(categoryId) : undefined,
        search: search || undefined,
      })
      .then((res) => setReports(res.reports.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reportService.getCategories().then((res) => setCategories(res.categories));
    adminService.getOfficers().then((res) => setOfficers(res.officers));
  }, []);

  useEffect(() => {
    fetchReports();
  }, [status, priority, categoryId]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !selectedOfficerId) return;
    setIsAssigning(true);
    try {
      await adminService.assignOfficer(selectedReport.id, {
        officer_id: selectedOfficerId,
        notes: assignNotes || undefined,
      });
      setShowAssignModal(false);
      setSelectedReport(null);
      setAssignNotes('');
      fetchReports();
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Manajemen Seluruh Laporan
        </h1>
        <p className="text-xs text-slate-500">
          Database komprehensif aduan warga, pemantauan status pengerjaan, dan penugasan petugas
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari nomor, judul, lokasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchReports()}
              className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
          >
            <option value="">Semua Status</option>
            <option value="SUBMITTED">Menunggu Verifikasi</option>
            <option value="VERIFIED">Terverifikasi</option>
            <option value="ASSIGNED">Ditugaskan</option>
            <option value="IN_PROGRESS">Sedang Dikerjakan</option>
            <option value="RESOLVED">Selesai</option>
            <option value="REJECTED">Ditolak</option>
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
          >
            <option value="">Semua Prioritas</option>
            <option value="CRITICAL">Kritis</option>
            <option value="HIGH">Tinggi</option>
            <option value="MEDIUM">Sedang</option>
            <option value="LOW">Rendah</option>
          </select>
        </div>
      </Card>

      {/* Reports Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4">Nomor & Kategori</th>
                <th className="px-5 py-4">Judul & Lokasi</th>
                <th className="px-5 py-4">Prioritas</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Petugas Ditugaskan</th>
                <th className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Memuat data laporan...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Tidak ada laporan yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-medium">
                      <div className="font-bold text-slate-900">{r.report_number}</div>
                      <span className="text-[10px] text-teal-700 font-semibold">{r.category?.name}</span>
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <div className="font-bold text-slate-900 truncate">{r.title}</div>
                      <div className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                        {r.address}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <PriorityBadge priority={r.priority} size="sm" />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                    <td className="px-5 py-4">
                      {r.latest_assignment?.officer ? (
                        <div className="text-slate-800 font-medium">
                          <p className="font-bold">{r.latest_assignment.officer.user?.name}</p>
                          <p className="text-[10px] text-slate-400">{r.latest_assignment.officer.department}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Belum ditugaskan</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/citizen/reports/${r.id}`} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3.5 h-3.5 text-teal-600" />}>
                            Detail
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                          onClick={() => {
                            setSelectedReport(r);
                            setSelectedOfficerId(officers[0]?.id || null);
                            setShowAssignModal(true);
                          }}
                        >
                          Assign
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ASSIGN OFFICER MODAL */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={`Tugaskan Petugas untuk #${selectedReport?.report_number}`}
        maxWidth="lg"
      >
        <form onSubmit={handleAssign} className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">{selectedReport?.title}</h4>
            <p className="text-xs text-slate-500">{selectedReport?.address}</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">
              Pilih Petugas Berdasarkan Beban Kerja (Workload)
            </label>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {officers.map((off) => {
                const isSelected = selectedOfficerId === off.id;
                return (
                  <div
                    key={off.id}
                    onClick={() => setSelectedOfficerId(off.id)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/40 ring-2 ring-teal-600/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{off.user?.name}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {off.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {off.department} • {off.unit || 'Tim Reaksi Cepat'}
                      </p>
                    </div>

                    <div className="text-right text-xs">
                      <span className="font-bold text-amber-700">{off.active_tasks_count} Aktif</span>
                      <p className="text-[10px] text-emerald-600">{off.completed_tasks_count} Selesai</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Instruksi Khusus untuk Petugas</label>
            <textarea
              rows={3}
              value={assignNotes}
              onChange={(e) => setAssignNotes(e.target.value)}
              placeholder="Tulis instruksi khusus / nomor kontak penanggung jawab di lokasi..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setShowAssignModal(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isAssigning}>
              Konfirmasi Penugasan Petugas
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
