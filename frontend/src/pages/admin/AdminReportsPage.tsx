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
  MoreVertical,
  Copy,
  Check,
  AlertCircle,
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
  const [assignError, setAssignError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  // 3-dots action menu state
  const [activeMenuReportId, setActiveMenuReportId] = useState<number | null>(null);
  const [copiedReportId, setCopiedReportId] = useState<number | null>(null);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuReportId(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveMenuReportId(null);
    };
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleCopyNumber = (reportNumber: string, id: number) => {
    navigator.clipboard.writeText(reportNumber);
    setCopiedReportId(id);
    setTimeout(() => {
      setCopiedReportId(null);
      setActiveMenuReportId(null);
    }, 1200);
  };

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
    if (!selectedReport) {
      setAssignError('Data laporan tidak ditemukan.');
      return;
    }
    if (!selectedOfficerId) {
      setAssignError('Silakan pilih salah satu petugas dari daftar.');
      return;
    }
    setIsAssigning(true);
    setAssignError(null);
    try {
      const res = await adminService.assignOfficer(selectedReport.id, {
        officer_id: selectedOfficerId,
        notes: assignNotes || undefined,
      });
      setShowAssignModal(false);
      setSelectedReport(null);
      setAssignNotes('');
      setSuccessMsg(res.message || 'Petugas berhasil ditugaskan.');
      setTimeout(() => setSuccessMsg(null), 5000);
      fetchReports();
    } catch (err: any) {
      setAssignError(
        err.response?.data?.message ||
        err.response?.data?.errors?.officer_id?.[0] ||
        'Gagal menugaskan petugas. Silakan coba kembali.'
      );
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

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

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
        <div className="overflow-x-auto min-h-[380px]">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">Nomor & Kategori</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Judul & Lokasi</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Prioritas</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Status</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Petugas Ditugaskan</th>
                <th className="px-4 py-3.5 text-center whitespace-nowrap w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Memuat data laporan...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada laporan yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                reports.map((r, index) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap align-middle">
                      <div className="font-mono font-bold text-slate-900 text-xs tracking-tight">
                        {r.report_number}
                      </div>
                      <span className="inline-block text-[10px] text-teal-800 font-semibold bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-md mt-1">
                        {r.category?.name || 'Umum'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 align-middle min-w-[200px] max-w-xs">
                      <div className="font-bold text-slate-900 truncate" title={r.title}>
                        {r.title}
                      </div>
                      <div
                        className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5"
                        title={r.address}
                      >
                        <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                        <span className="truncate">{r.address}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap align-middle">
                      <PriorityBadge priority={r.priority} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap align-middle">
                      <StatusBadge status={r.status} size="sm" />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap align-middle">
                      {r.latest_assignment?.officer ? (
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {r.latest_assignment.officer.user?.name
                              ? r.latest_assignment.officer.user.name.charAt(0).toUpperCase()
                              : 'P'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs leading-none">
                              {r.latest_assignment.officer.user?.name}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1 leading-none">
                              {r.latest_assignment.officer.department}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center text-slate-400 italic text-[11px] bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded">
                          Belum ditugaskan
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap w-16 align-middle relative">
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuReportId(activeMenuReportId === r.id ? null : r.id);
                          }}
                          className={`p-1.5 rounded-lg border transition-all ${
                            activeMenuReportId === r.id
                              ? 'bg-teal-50 border-teal-300 text-teal-700 shadow-sm'
                              : 'border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-500 hover:text-slate-800'
                          }`}
                          title="Menu Aksi"
                          aria-label="Menu Aksi"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuReportId === r.id && (
                          <div
                            className={`absolute right-0 ${
                              index >= reports.length - 2 && reports.length > 2
                                ? 'bottom-full mb-1.5'
                                : 'top-full mt-1.5'
                            } w-44 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50 text-left`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link
                              to={`/citizen/reports/${r.id}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => setActiveMenuReportId(null)}
                              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span>Lihat Detail</span>
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuReportId(null);
                                setSelectedReport(r);
                                setAssignError(null);
                                const currentOfficerId = r.latest_assignment?.officer_id;
                                setSelectedOfficerId(currentOfficerId || officers[0]?.id || null);
                                setAssignNotes(r.latest_assignment?.notes || '');
                                setShowAssignModal(true);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-colors text-left"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span>Tugaskan Petugas</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyNumber(r.report_number, r.id)}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-colors text-left border-t border-slate-100 mt-1 pt-1.5"
                            >
                              {copiedReportId === r.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="text-emerald-600">Nomor Disalin!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>Salin No. Laporan</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
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
        onClose={() => {
          setShowAssignModal(false);
          setAssignError(null);
        }}
        title={`Tugaskan Petugas untuk #${selectedReport?.report_number}`}
        maxWidth="lg"
      >
        <form onSubmit={handleAssign} className="space-y-4">
          {assignError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="space-y-0.5">
                <p className="font-bold text-rose-800">Gagal Menugaskan Petugas</p>
                <p className="text-rose-700">{assignError}</p>
              </div>
            </div>
          )}

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
                const isCurrentOfficer = selectedReport?.latest_assignment?.officer_id === off.id;
                return (
                  <div
                    key={off.id}
                    onClick={() => {
                      setSelectedOfficerId(off.id);
                      setAssignError(null);
                    }}
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
                        {isCurrentOfficer && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                            Petugas Saat Ini
                          </span>
                        )}
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
