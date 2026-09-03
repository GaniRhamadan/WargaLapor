import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { officerService } from '../../services/officerService';
import { Report } from '../../types/report';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { StatusTimeline } from '../../components/reports/StatusTimeline';
import { AiAnalysisBadge } from '../../components/reports/AiAnalysisBadge';
import { ReportMap } from '../../components/maps/ReportMap';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  HardHat,
  MapPin,
  Navigation,
  Phone,
  PlayCircle,
  Upload,
  User,
  AlertCircle,
} from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';

export const OfficerTaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  // Update Status Modal State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<'IN_PROGRESS' | 'WAITING' | 'RESOLVED'>('IN_PROGRESS');
  const [notes, setNotes] = useState('');
  const [proofImage, setProofImage] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTask = () => {
    if (!id) return;
    setLoading(true);
    officerService
      .getTask(id)
      .then((res) => setTask(res.task))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) setProofImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSampleProof = () => {
    setProofImage('https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=60');
  };

  const handleSubmitStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    setErrorMsg(null);

    if (targetStatus === 'RESOLVED' && !proofImage) {
      setErrorMsg('Foto bukti pengerjaan selesai wajib diunggah.');
      return;
    }

    if (!notes.trim()) {
      setErrorMsg('Catatan pengerjaan wajib diisi.');
      return;
    }

    setIsUpdating(true);
    try {
      await officerService.updateStatus(task.id, {
        status: targetStatus,
        notes,
        resolution_proof_image: proofImage || undefined,
      });
      setShowStatusModal(false);
      setNotes('');
      setProofImage('');
      fetchTask();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal memperbarui status tugas.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-xs text-slate-400">Memuat detail tugas...</div>;
  if (!task) return <div className="py-20 text-center text-xs text-slate-400">Tugas tidak ditemukan.</div>;

  const resolutionImage = task.images?.find((img) => img.image_type === 'RESOLUTION');

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/officer/tasks"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Tugas
        </Link>

        {task.status !== 'RESOLVED' && task.status !== 'CLOSED' && (
          <Button
            variant="primary"
            size="md"
            leftIcon={<HardHat className="w-4 h-4" />}
            onClick={() => {
              setTargetStatus(task.status === 'ASSIGNED' ? 'IN_PROGRESS' : 'RESOLVED');
              setShowStatusModal(true);
            }}
          >
            Update Progres / Selesaikan Tugas
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Task Details */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="text-xs font-black text-slate-900 px-2.5 py-1 bg-slate-100 rounded-lg">
                #{task.report_number}
              </span>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={task.priority} size="sm" />
                <StatusBadge status={task.status} size="sm" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">{task.title}</h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {task.description}
              </p>
            </div>

            {/* Photos */}
            {task.images && task.images.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700">Foto Aduan Warga:</p>
                <div className="grid grid-cols-2 gap-3">
                  {task.images.map((img) => (
                    <img
                      key={img.id}
                      src={getImageUrl(img.image_path)}
                      alt=""
                      className="rounded-2xl border border-slate-200 aspect-video object-cover w-full"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Citizen Reporter Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Informasi Kontak Pelapor
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  {task.user?.name || 'Warga Masyarakat'}
                </span>
                {task.user?.phone && (
                  <a
                    href={`tel:${task.user.phone}`}
                    className="font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {task.user.phone}
                  </a>
                )}
              </div>
            </div>
          </Card>

          {task.ai_analysis && <AiAnalysisBadge analysis={task.ai_analysis} />}
        </div>

        {/* RIGHT COLUMN: Map & Timeline */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Lokasi Tugas</h3>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${task.latitude},${task.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1"
              >
                <Navigation className="w-3 h-3" /> Buka Rute Peta
              </a>
            </div>
            <ReportMap reports={[task]} height="220px" zoom={15} showLinkToDetail={false} />
            <p className="text-xs text-slate-600 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{task.address}</span>
            </p>
          </Card>

          <Card className="p-6 space-y-5">
            <h3 className="text-base font-bold text-slate-900">Riwayat Penanganan</h3>
            <StatusTimeline histories={task.status_histories} resolutionImage={resolutionImage} />
          </Card>
        </div>
      </div>

      {/* UPDATE STATUS MODAL */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Update Status Pengerjaan Lapangan"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitStatusUpdate} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Pilih Status Baru</label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as any)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="IN_PROGRESS">Sedang Dikerjakan di Lapangan (IN_PROGRESS)</option>
              <option value="WAITING">Menunggu Material / Cuaca (WAITING)</option>
              <option value="RESOLVED">Selesai Ditangani (RESOLVED - Wajib Foto Bukti)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Catatan Tindakan Petugas *</label>
            <textarea
              rows={3}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Telah dilakukan pemotongan dahan pohon beringin dan pembersihan sisa kayu di bahu jalan..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Upload Proof Image when RESOLVED */}
          {targetStatus === 'RESOLVED' && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-600" />
                Unggah Foto Bukti Selesai (Wajib) *
              </label>

              <div className="border-2 border-dashed border-emerald-300 rounded-2xl p-4 text-center bg-emerald-50/40 relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProofUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-1">
                  <Upload className="w-6 h-6 text-emerald-600" />
                  <p className="text-xs font-bold text-slate-700">Klik untuk upload foto hasil perbaikan</p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSampleProof}
                  className="text-[11px] font-bold text-emerald-700 underline"
                >
                  + Gunakan Contoh Foto Bukti Selesai
                </button>
              </div>

              {proofImage && (
                <div className="relative rounded-xl overflow-hidden border border-emerald-300 aspect-video max-h-48 mt-2">
                  <img src={proofImage} alt="Bukti" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setShowStatusModal(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isUpdating}>
              Simpan Update Status
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
