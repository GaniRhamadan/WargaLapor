import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Star, MessageSquare } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comments: string) => Promise<void>;
  reportNumber: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  reportNumber,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comments, setComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onSubmit(rating, comments);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Beri Penilaian & Feedback Penanganan"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-xs text-slate-500">
          Laporan <strong>#{reportNumber}</strong> telah selesai dikerjakan oleh petugas lapangan. Bagaimana kepuasan Anda terhadap kecepatan dan hasil perbaikan?
        </p>

        {/* 5-Star Rating Selector */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1 text-slate-300 hover:text-amber-400 focus:outline-none transition-colors cursor-pointer"
              >
                <Star
                  className={`w-8 h-8 ${
                    (hoverRating || rating) >= star
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-300'
                  } transition-transform hover:scale-110`}
                />
              </button>
            ))}
          </div>
          <span className="text-xs font-bold text-slate-700">
            {rating === 5 && '⭐⭐⭐⭐⭐ Sangat Puas & Cepat'}
            {rating === 4 && '⭐⭐⭐⭐ Puas'}
            {rating === 3 && '⭐⭐⭐ Cukup'}
            {rating === 2 && '⭐⭐ Kurang Puas'}
            {rating === 1 && '⭐ Tidak Puas'}
          </span>
        </div>

        {/* Comments Textarea */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
            Ulasan / Catatan untuk Petugas (Opsional)
          </label>
          <textarea
            rows={3}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Tuliskan apresiasi atau masukan perbaikan Anda..."
            className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Kirim Penilaian
          </Button>
        </div>
      </form>
    </Modal>
  );
};
