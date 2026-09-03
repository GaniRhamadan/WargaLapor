import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { reportService } from '../../services/reportService';
import { Report } from '../../types/report';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { AiAnalysisBadge } from '../../components/reports/AiAnalysisBadge';
import { StatusTimeline } from '../../components/reports/StatusTimeline';
import { FeedbackModal } from '../../components/reports/FeedbackModal';
import { ReportMap } from '../../components/maps/ReportMap';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  HardHat,
  MapPin,
  MessageSquare,
  Send,
  Shield,
  Star,
  User,
  AlertTriangle,
} from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';

export const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [commentText, setCommentText] = useState<string>('');
  const [isSendingComment, setIsSendingComment] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  const fetchDetail = () => {
    if (!id) return;
    setLoading(true);
    reportService
      .getReport(id)
      .then((res) => {
        setReport(res.report);
        if (res.report.images && res.report.images.length > 0) {
          setActivePhoto(getImageUrl(res.report.images[0].image_path));
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report || !commentText.trim()) return;
    setIsSendingComment(true);
    try {
      await reportService.addComment(report.id, { comment: commentText });
      setCommentText('');
      fetchDetail();
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleFeedbackSubmit = async (rating: number, comments: string) => {
    if (!report) return;
    await reportService.addFeedback(report.id, { rating, comments });
    fetchDetail();
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">
        Memuat data detail laporan...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="py-20 text-center space-y-4">
        <h3 className="text-lg font-bold text-slate-800">Laporan Tidak Ditemukan</h3>
        <Link to="/citizen/reports">
          <Button variant="primary" size="sm">
            Kembali ke Daftar Laporan
          </Button>
        </Link>
      </div>
    );
  }

  const resolutionImage = report.images?.find((img) => img.image_type === 'RESOLUTION');
  const isResolved = report.status === 'RESOLVED' || report.status === 'CLOSED';
  const isReporter = user?.id === report.user_id;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header Back & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/citizen/reports"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Laporan Saya
        </Link>

        <div className="flex items-center gap-2">
          {/* Feedback trigger button for reporter when report is resolved */}
          {isReporter && isResolved && !report.feedback && (
            <Button
              variant="success"
              size="sm"
              leftIcon={<Star className="w-4 h-4 text-amber-300 fill-amber-300" />}
              onClick={() => setShowFeedbackModal(true)}
              className="bg-emerald-600 font-bold shadow-sm"
            >
              Beri Rating & Feedback Petugas
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Details & Right Timeline/Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Report Details, Photos, AI Analysis */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Info Card */}
          <Card className="p-6 sm:p-8 space-y-6">
            {/* Badges & Report Number */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 px-2.5 py-1 bg-slate-100 rounded-lg">
                  {report.report_number}
                </span>
                <span
                  style={{ backgroundColor: report.category?.color || '#0D9488' }}
                  className="text-white text-[11px] font-bold px-2.5 py-1 rounded-lg"
                >
                  {report.category?.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={report.priority} size="sm" />
                <StatusBadge status={report.status} size="sm" />
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-3">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                {report.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {report.description}
              </p>
            </div>

            {/* Attached Photos Gallery */}
            {report.images && report.images.length > 0 && (
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold text-slate-700">Foto Lampiran Lapangan:</p>
                {activePhoto && (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 aspect-video max-h-80 bg-slate-900">
                    <img
                      src={activePhoto}
                      alt="Foto Terpilih"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                {report.images.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {report.images.map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setActivePhoto(getImageUrl(img.image_path))}
                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                          activePhoto === getImageUrl(img.image_path)
                            ? 'border-teal-600 ring-2 ring-teal-100'
                            : 'border-slate-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={getImageUrl(img.image_path)} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Location & Address Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                <span>{report.address}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Koordinat GPS: {report.latitude}, {report.longitude} ({report.city || 'DKI Jakarta'})
              </p>
            </div>
          </Card>

          {/* AI Analysis Insight Card */}
          {report.ai_analysis && (
            <AiAnalysisBadge analysis={report.ai_analysis} />
          )}

          {/* Citizen Feedback Rating Card (if submitted) */}
          {report.feedback && (
            <Card className="p-6 bg-emerald-50/50 border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <h4 className="text-sm font-bold text-emerald-950">
                    Feedback & Kepuasan Pelapor
                  </h4>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Rating: {report.feedback.rating} / 5
                </span>
              </div>
              {report.feedback.comments && (
                <p className="text-xs text-emerald-900 bg-white p-3 rounded-xl border border-emerald-100 leading-relaxed italic">
                  "{report.feedback.comments}"
                </p>
              )}
            </Card>
          )}

          {/* Comments & Discussion Thread */}
          <Card className="p-6 space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-600" />
              Komentar & Klarifikasi ({report.comments?.length || 0})
            </h3>

            {/* Comment Form */}
            {user && (
              <form onSubmit={handleSendComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tulis tanggapan atau pertanyaan tambahan..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSendingComment}
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  Kirim
                </Button>
              </form>
            )}

            {/* Comment Items */}
            <div className="space-y-3">
              {report.comments?.map((c) => (
                <div key={c.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      {c.user?.name || 'Warga'}
                      {c.user?.role === 'officer' && (
                        <span className="ml-1 px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] uppercase font-bold">
                          Petugas
                        </span>
                      )}
                      {c.user?.role === 'admin' && (
                        <span className="ml-1 px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[10px] uppercase font-bold">
                          Admin
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(c.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{c.comment}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Interactive MiniMap & Status Timeline */}
        <div className="lg:col-span-5 space-y-6">
          {/* Mini Map */}
          <Card className="p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Peta Lokasi Kejadian
            </h3>
            <ReportMap reports={[report]} height="240px" zoom={15} showLinkToDetail={false} />
          </Card>

          {/* Assigned Officer Card (if available) */}
          {report.latest_assignment?.officer && (
            <Card className="p-5 bg-amber-50/40 border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-800">
                <HardHat className="w-5 h-5 text-amber-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Petugas Ditugaskan</h4>
              </div>
              <p className="text-sm font-bold text-slate-900">
                {report.latest_assignment.officer.user?.name}
              </p>
              <p className="text-xs text-slate-600">
                {report.latest_assignment.officer.department} • {report.latest_assignment.officer.unit || 'Tim Wilayah'}
              </p>
            </Card>
          )}

          {/* Vertical Progress Timeline */}
          <Card className="p-6 space-y-5">
            <h3 className="text-base font-bold text-slate-900">Riwayat Penanganan</h3>
            <StatusTimeline
              histories={report.status_histories}
              resolutionImage={resolutionImage}
            />
          </Card>
        </div>
      </div>

      {/* Citizen Feedback Rating Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
        reportNumber={report.report_number}
      />
    </div>
  );
};
