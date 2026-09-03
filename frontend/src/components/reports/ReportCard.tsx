import React from 'react';
import { Link } from 'react-router-dom';
import { Report } from '../../types/report';
import { StatusBadge, PriorityBadge } from '../common/Badge';
import { Card } from '../common/Card';
import { Calendar, Eye, MapPin, Sparkles } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';

interface ReportCardProps {
  report: Report;
  detailUrl?: string;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, detailUrl }) => {
  const targetUrl = detailUrl || `/citizen/reports/${report.id}`;
  const defaultImage = getImageUrl(
    report.images && report.images.length > 0 ? report.images[0].image_path : null
  );

  return (
    <Card hoverEffect className="flex flex-col justify-between h-full p-0 overflow-hidden group">
      <div>
        {/* Image Thumbnail & Floating Badges */}
        <div className="relative h-48 w-full overflow-hidden bg-slate-100">
          <img
            src={defaultImage}
            alt={report.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 via-transparent to-black/30" />

          {/* Category Tag */}
          <div className="absolute top-3 left-3">
            <span
              style={{ backgroundColor: report.category?.color || '#0D9488' }}
              className="text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm"
            >
              {report.category?.name || 'Fasilitas'}
            </span>
          </div>

          {/* Priority Badge */}
          <div className="absolute top-3 right-3">
            <PriorityBadge priority={report.priority} size="sm" />
          </div>

          {/* Report Number & Date */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
            <span className="font-bold tracking-wide drop-shadow-xs">{report.report_number}</span>
            <span className="flex items-center gap-1 opacity-90 drop-shadow-xs text-[11px]">
              <Calendar className="w-3 h-3" />
              {new Date(report.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3">
          <h4 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-teal-600 transition-colors">
            {report.title}
          </h4>

          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {report.description}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
            <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="truncate">{report.address}</span>
          </div>

          {/* AI classification summary tag */}
          {report.ai_analysis && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 text-[11px] font-medium border border-teal-100">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span className="truncate">AI: {report.ai_analysis.summary || `Tingkat keparahan ${report.ai_analysis.severity}`}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <StatusBadge status={report.status} size="sm" />
        <Link
          to={targetUrl}
          className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Lihat Detail
        </Link>
      </div>
    </Card>
  );
};
