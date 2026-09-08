import React from 'react';
import { ReportPriority, ReportStatus, VerificationStatus } from '../../types/report';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  HelpCircle,
  Hourglass,
  Info,
  PlayCircle,
  XCircle,
} from 'lucide-react';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-medium px-2.5 py-1',
    lg: 'text-sm font-medium px-3 py-1.5',
  }[size];

  const variantClasses = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    primary: 'bg-teal-50 text-teal-700 border border-teal-200',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
    info: 'bg-sky-50 text-sky-700 border border-sky-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200',
  }[variant];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full whitespace-nowrap select-none ${sizeClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: ReportStatus; size?: 'sm' | 'md' | 'lg' }> = ({ status, size = 'md' }) => {
  switch (status) {
    case 'SUBMITTED':
      return (
        <Badge variant="warning" size={size}>
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Menunggu Verifikasi
        </Badge>
      );
    case 'UNDER_REVIEW':
      return (
        <Badge variant="info" size={size}>
          <Hourglass className="w-3.5 h-3.5 text-sky-600" />
          Sedang Ditinjau
        </Badge>
      );
    case 'VERIFIED':
      return (
        <Badge variant="primary" size={size}>
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
          Terverifikasi
        </Badge>
      );
    case 'ASSIGNED':
      return (
        <Badge variant="purple" size={size}>
          <Info className="w-3.5 h-3.5 text-purple-600" />
          Petugas Ditugaskan
        </Badge>
      );
    case 'IN_PROGRESS':
      return (
        <Badge variant="info" size={size}>
          <PlayCircle className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
          Sedang Dikerjakan
        </Badge>
      );
    case 'WAITING':
      return (
        <Badge variant="warning" size={size}>
          <Hourglass className="w-3.5 h-3.5 text-amber-600" />
          Menunggu Material/Kondisi
        </Badge>
      );
    case 'RESOLVED':
    case 'CLOSED':
      return (
        <Badge variant="success" size={size}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Selesai Ditangani
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="danger" size={size}>
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Laporan Ditolak
        </Badge>
      );
    default:
      return (
        <Badge variant="default" size={size}>
          <HelpCircle className="w-3.5 h-3.5" />
          {status}
        </Badge>
      );
  }
};

export const PriorityBadge: React.FC<{ priority: ReportPriority; size?: 'sm' | 'md' | 'lg' }> = ({ priority, size = 'md' }) => {
  switch (priority) {
    case 'CRITICAL':
      return (
        <Badge variant="danger" size={size} className="animate-pulse font-semibold">
          <Flame className="w-3.5 h-3.5 text-rose-600" />
          Prioritas Kritis
        </Badge>
      );
    case 'HIGH':
      return (
        <Badge variant="warning" size={size} className="font-semibold text-orange-700 bg-orange-50 border-orange-200">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
          Prioritas Tinggi
        </Badge>
      );
    case 'MEDIUM':
      return (
        <Badge variant="warning" size={size}>
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Prioritas Sedang
        </Badge>
      );
    case 'LOW':
      return (
        <Badge variant="success" size={size}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Prioritas Rendah
        </Badge>
      );
    default:
      return <Badge size={size}>{priority}</Badge>;
  }
};
