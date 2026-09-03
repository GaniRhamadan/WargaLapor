import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { DuplicateReportItem } from '../../types/report';
import { AlertTriangle, CheckCircle, CopyCheck, MapPin } from 'lucide-react';
import { StatusBadge } from '../common/Badge';

interface DuplicateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicates: DuplicateReportItem[];
  onMerge: (originalReportId: number) => void;
  onProceedAnyway: () => void;
}

export const DuplicateAlertModal: React.FC<DuplicateAlertModalProps> = ({
  isOpen,
  onClose,
  duplicates,
  onMerge,
  onProceedAnyway,
}) => {
  if (duplicates.length === 0) return null;
  const topMatch = duplicates[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="xl"
      title={
        <div className="flex items-center gap-2 text-amber-600">
          <AlertTriangle className="w-5 h-5" />
          <span>Kemungkinan Laporan Serupa Ditemukan</span>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed">
          <p className="font-bold text-sm mb-1">
            Tingkat Kesamaan: {topMatch.similarity_percentage}% • Jarak: ±{Math.round(topMatch.distance_meters)} meter
          </p>
          Sistem mendeteksi adanya laporan warga lain di sekitar lokasi Anda yang sedang aktif diproses. Anda dapat memilih untuk mendukung laporan yang sudah ada atau tetap mengirim laporan baru.
        </div>

        {/* Existing Matching Report Preview */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              #{topMatch.report.report_number}
            </span>
            <StatusBadge status={topMatch.report.status} size="sm" />
          </div>

          <h4 className="text-sm font-bold text-slate-900 leading-snug">
            {topMatch.report.title}
          </h4>

          <p className="text-xs text-slate-600 line-clamp-2">
            {topMatch.report.description}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="truncate">{topMatch.report.address}</span>
          </div>
        </div>

        {/* Action Choice Buttons */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onProceedAnyway}
            className="w-full sm:w-auto"
          >
            Tetap Kirim Laporan Baru
          </Button>

          <Button
            type="button"
            variant="primary"
            leftIcon={<CopyCheck className="w-4 h-4" />}
            onClick={() => onMerge(topMatch.report.id)}
            className="w-full sm:w-auto"
          >
            Gabungkan & Pantau Laporan Ini
          </Button>
        </div>
      </div>
    </Modal>
  );
};
