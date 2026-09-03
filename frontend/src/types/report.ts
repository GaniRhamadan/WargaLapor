import { User } from './auth';

export type ReportStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING'
  | 'RESOLVED'
  | 'REJECTED'
  | 'CLOSED';

export type ReportPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NEEDS_INFO';

export interface ReportCategory {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon: string;
  color: string;
  default_priority: ReportPriority;
  is_active: boolean;
  reports_count?: number;
}

export interface ReportImage {
  id: number;
  report_id: number;
  image_path: string;
  image_type: 'REPORT' | 'PROGRESS' | 'RESOLUTION';
  caption?: string | null;
  uploaded_by?: number | null;
  created_at?: string;
}

export interface ReportStatusHistory {
  id: number;
  report_id: number;
  status: ReportStatus;
  actor_id?: number | null;
  actor_name?: string | null;
  actor_role?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface AiAnalysis {
  id?: number;
  report_id?: number;
  category_suggested?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  hazard_level: 'low' | 'medium' | 'high' | 'critical';
  summary?: string;
  recommendation?: string;
  raw_response?: any;
  is_fallback?: boolean;
}

export interface DuplicateReportItem {
  report: Report;
  similarity_percentage: number;
  distance_meters: number;
  summary: string;
}

export interface DuplicateCheckResult {
  is_duplicate: boolean;
  similarity_percentage: number;
  duplicates: DuplicateReportItem[];
}

export interface ReportFeedback {
  id?: number;
  report_id: number;
  user_id: number;
  rating: number; // 1 to 5
  comments?: string | null;
  created_at?: string;
}

export interface ReportComment {
  id: number;
  report_id: number;
  user_id: number;
  user?: User;
  comment: string;
  is_internal: boolean;
  created_at: string;
}

export interface ReportAssignment {
  id: number;
  report_id: number;
  officer_id: number;
  assigned_by?: number | null;
  notes?: string | null;
  status: string;
  assigned_at: string;
  accepted_at?: string | null;
  completed_at?: string | null;
  officer?: {
    id: number;
    user_id: number;
    department: string;
    unit?: string | null;
    area_coverage?: string | null;
    user?: User;
  };
}

export interface Report {
  id: number;
  report_number: string;
  user_id: number;
  category_id: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  subdistrict?: string | null;
  priority: ReportPriority;
  status: ReportStatus;
  verification_status: VerificationStatus;
  rejection_reason?: string | null;
  sla_deadline?: string | null;
  is_overdue?: boolean;
  verified_at?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;

  user?: User;
  category?: ReportCategory;
  images?: ReportImage[];
  status_histories?: ReportStatusHistory[];
  ai_analysis?: AiAnalysis;
  duplicate_reports?: any[];
  latest_assignment?: ReportAssignment;
  comments?: ReportComment[];
  feedback?: ReportFeedback;
}
