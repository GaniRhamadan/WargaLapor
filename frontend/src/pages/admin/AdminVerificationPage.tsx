import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { Report, ReportPriority } from '../../types/report';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { PriorityBadge, StatusBadge } from '../../components/common/Badge';
import { AiAnalysisBadge } from '../../components/reports/AiAnalysisBadge';
import { EmptyState } from '../../components/common/EmptyState';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  FileCheck,
  MapPin,
  Sparkles,
  User,
  XCircle,
} from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';

export const AdminVerificationPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Verification & Reject Modal State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [overridePriority, setOverridePriority] = useState<ReportPriority>('MEDIUM');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPendingReports = () => {
    setLoading(true);
    adminService
      .getReports({ verification_status: 'PENDING' })
      .then((res) => setReports(res.reports.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPendingReports();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    setIsProcessing(true);
    try {
      await adminService.verifyReport(selectedReport.id, {
        priority: overridePriority,
        notes: adminNotes || undefined,
      });
      setShowVerifyModal(false);
      setSelectedReport(null);
      setAdminNotes('');
      fetchPendingReports();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !rejectionReason.trim()) return;
    setIsProcessing(true);
    try {
      await adminService.rejectReport(selectedReport.id, {
        reason: rejectionReason,
      });
      setShowRejectModal(false);
      setSelectedReport(null);
      setRejectionReason('');
      fetchPendingReports();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Verifikasi Laporan Masuk
        </h1>
        <p className="text-xs text-slate-500">
          Tinjau validitas aduan warga, evaluasi analisis AI, dan verifikasi untuk penugasan dinas
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Memuat antrean verifikasi...</div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<FileCheck className="w-10 h-10 text-emerald-400" />}
          title="Semua Laporan Telah Terverifikasi"
          description="Bagus! Tidak ada antrean aduan baru yang menunggu verifikasi saat ini."
        />
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                    #{report.report_number}
                  </span>
                  <span
                    style={{ backgroundColor: report.category?.color || '#0D9488' }}
                    className="text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md"
                  >
                    {report.category?.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    Pelapor: {report.user?.name || 'Warga'} ({report.user?.email})
                  </span>
                </div>
                <PriorityBadge priority={report.priority} size="sm" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 space-y-3">
                  <h3 className="text-base font-bold text-slate-900">{report.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {report.description}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                    <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>{report.address}</span>
                  </p>

                  {/* AI Analysis Insight */}
                  {report.ai_analysis && (
                    <AiAnalysisBadge analysis={report.ai_analysis} />
                  )}
                </div>

                <div className="lg:col-span-4 space-y-3">
                  {report.images && report.images.length > 0 && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 aspect-video">
                      <img
                        src={getImageUrl(report.images[0].image_path)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                      className="flex-1"
                      onClick={() => {
                        setSelectedReport(report);
                        setOverridePriority(report.priority);
                        setShowVerifyModal(true);
                      }}
                    >
                      Verifikasi
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      leftIcon={<XCircle className="w-4 h-4" />}
                      onClick={() => {
                        setSelectedReport(report);
                        setShowRejectModal(true);
                      }}
                    >
                      Tolak
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* VERIFY MODAL */}
      <Modal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        title={`Verifikasi Laporan #${selectedReport?.report_number}`}
        maxWidth="md"
      >
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Tingkat Prioritas Penanganan</label>
            <select
              value={overridePriority}
              onChange={(e) => setOverridePriority(e.target.value as ReportPriority)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
            >
              <option value="CRITICAL">CRITICAL (SLA 4 Jam - Darurat)</option>
              <option value="HIGH">HIGH (SLA 12 Jam - Tinggi)</option>
              <option value="MEDIUM">MEDIUM (SLA 24 Jam - Standar)</option>
              <option value="LOW">LOW (SLA 72 Jam - Rendah/Rutin)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Catatan Verifikasi Admin (Opsional)</label>
            <textarea
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Instruksi awal untuk dinas pelaksana..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setShowVerifyModal(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isProcessing}>
              Setujui & Verifikasi Laporan
            </Button>
          </div>
        </form>
      </Modal>

      {/* REJECT MODAL */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title={`Tolak Laporan #${selectedReport?.report_number}`}
        maxWidth="md"
      >
        <form onSubmit={handleReject} className="space-y-4">
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            Admin wajib memberikan alasan penolakan yang jelas agar pelapor memahami penyebab aduan tidak dapat diproses.
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Alasan Penolakan Laporan *</label>
            <textarea
              rows={3}
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Contoh: Lokasi berada di area properti pribadi tertutup yang bukan merupakan wewenang dinas pemerintah kota..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setShowRejectModal(false)}>
              Batal
            </Button>
            <Button type="submit" variant="danger" isLoading={isProcessing}>
              Konfirmasi Tolak Laporan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
