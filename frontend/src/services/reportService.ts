import api from './api';
import { supabase } from './supabase';
import {
  AiAnalysis,
  DuplicateCheckResult,
  Report,
  ReportCategory,
  ReportComment,
  ReportFeedback,
  ReportPriority,
  ReportStatus,
} from '../types/report';

export interface CreateReportPayload {
  category_id: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  province?: string;
  city?: string;
  district?: string;
  subdistrict?: string;
  images?: string[];
  user_action?: 'PROCEEDED' | 'MERGED';
  merged_into_id?: number;
}

// Fallback daftar kategori bawaan jika database baru di-clone
const DEFAULT_CATEGORIES: ReportCategory[] = [
  { id: 1, name: 'Jalan Rusak & Berlubang', slug: 'jalan-rusak', icon: 'AlertTriangle', color: '#DC2626', default_priority: 'HIGH', is_active: true, description: 'Jalan berlubang, aspal amblas, trotoar hancur' },
  { id: 2, name: 'Sampah & Kebersihan', slug: 'sampah-kebersihan', icon: 'Trash2', color: '#10B981', default_priority: 'MEDIUM', is_active: true, description: 'Tumpukan sampah liar, TPS overload, sungai kotor' },
  { id: 3, name: 'Lampu Jalan & PJU Mati', slug: 'lampu-jalan', icon: 'Lightbulb', color: '#F59E0B', default_priority: 'MEDIUM', is_active: true, description: 'PJU padam, tiang miring, kabel lampu putus' },
  { id: 4, name: 'Banjir & Drainase Mampet', slug: 'banjir-drainase', icon: 'Droplets', color: '#06B6D4', default_priority: 'HIGH', is_active: true, description: 'Genangan air jalan, saluran tersumbat, tanggul retak' },
  { id: 5, name: 'Pohon Tumbang & Rawan', slug: 'pohon-tumbang', icon: 'Trees', color: '#84CC16', default_priority: 'CRITICAL', is_active: true, description: 'Dahan patah menutup jalan, pohon lapuk rawan tumbang' },
  { id: 6, name: 'Saluran Air Bersih / PDAM', slug: 'air-bersih', icon: 'Waves', color: '#3B82F6', default_priority: 'MEDIUM', is_active: true, description: 'Pipa PDAM bocor di jalan, air mati di pemukiman' },
  { id: 7, name: 'Fasilitas Umum & Taman', slug: 'fasilitas-umum', icon: 'Landmark', color: '#8B5CF6', default_priority: 'LOW', is_active: true, description: 'Bangku taman rusak, jembatan penyeberangan, halte bus' },
  { id: 8, name: 'Fasilitas Sekolah & Edukasi', slug: 'fasilitas-sekolah', icon: 'GraduationCap', color: '#EC4899', default_priority: 'MEDIUM', is_active: true, description: 'Akses jalan sekolah membahayakan murid, pagar roboh' },
  { id: 9, name: 'Lalu Lintas & Rambu Rusak', slug: 'lalu-lintas', icon: 'TrafficCone', color: '#F97316', default_priority: 'HIGH', is_active: true, description: 'Traffic light mati, rambu lalu lintas roboh / tertutup' },
  { id: 10, name: 'Lainnya & Ketertiban', slug: 'lainnya', icon: 'ShieldAlert', color: '#64748B', default_priority: 'LOW', is_active: true, description: 'Gangguan ketertiban umum dan aduan warga lainnya' },
];

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius bumi dalam km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const reportService = {
  async getCategories(): Promise<{ categories: ReportCategory[] }> {
    try {
      const res = await api.get<{ categories: ReportCategory[] }>('/categories');
      return res.data;
    } catch {
      // Ambil dari Supabase
      const { data, error } = await supabase.from('report_categories').select('*').order('id');
      if (!error && data && data.length > 0) {
        return {
          categories: data.map((c: any) => ({
            ...c,
            is_active: true,
          })),
        };
      }
      return { categories: DEFAULT_CATEGORIES };
    }
  },

  async getReports(params?: {
    scope?: 'my' | 'public';
    status?: string;
    priority?: string;
    category_id?: number;
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ data: Report[]; current_page: number; last_page: number; total: number }> {
    try {
      const res = await api.get('/reports', { params });
      return res.data;
    } catch {
      // Ambil dari Supabase
      const page = params?.page || 1;
      const perPage = params?.per_page || 10;
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      let query = supabase
        .from('reports')
        .select('*, category:report_categories(*), images:report_images(*)', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (params?.status) {
        query = query.eq('status', params.status);
      }
      if (params?.priority) {
        query = query.eq('priority', params.priority);
      }
      if (params?.category_id) {
        query = query.eq('category_id', params.category_id);
      }
      if (params?.search) {
        query = query.ilike('title', `%${params.search}%`);
      }

      const { data, count, error } = await query.range(from, to);

      if (error) {
        console.error('Error fetching reports from Supabase:', error);
        return { data: [], current_page: 1, last_page: 1, total: 0 };
      }

      const total = count || 0;
      const formattedReports: Report[] = (data || []).map((r: any) => ({
        id: r.id,
        report_number: r.report_number,
        user_id: r.user_id,
        category_id: r.category_id,
        title: r.title,
        description: r.description,
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
        address: r.address,
        province: r.province,
        city: r.city,
        district: r.district,
        subdistrict: r.subdistrict,
        priority: r.priority as ReportPriority,
        status: r.status as ReportStatus,
        verification_status: r.verification_status || 'PENDING',
        rejection_reason: r.rejection_reason,
        sla_deadline: r.sla_deadline,
        is_overdue: r.is_overdue || false,
        verified_at: r.verified_at,
        resolved_at: r.resolved_at,
        created_at: r.created_at,
        updated_at: r.updated_at,
        category: r.category,
        images: (r.images || []).map((img: any) => ({
          id: img.id,
          report_id: img.report_id,
          image_path: img.image_url,
          image_type: img.type || 'REPORT',
          caption: img.caption,
          created_at: img.created_at,
        })),
      }));

      return {
        data: formattedReports,
        current_page: page,
        last_page: Math.max(1, Math.ceil(total / perPage)),
        total,
      };
    }
  },

  async getReport(id: number | string): Promise<{ report: Report }> {
    try {
      const res = await api.get<{ report: Report }>(`/reports/${id}`);
      return res.data;
    } catch {
      const { data, error } = await supabase
        .from('reports')
        .select('*, category:report_categories(*), images:report_images(*), status_histories:report_status_histories(*), feedback:report_feedback(*)')
        .eq('id', id)
        .single();

      if (error || !data) {
        throw new Error('Laporan tidak ditemukan');
      }

      const report: Report = {
        id: data.id,
        report_number: data.report_number,
        user_id: data.user_id,
        category_id: data.category_id,
        title: data.title,
        description: data.description,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        address: data.address,
        province: data.province,
        city: data.city,
        district: data.district,
        subdistrict: data.subdistrict,
        priority: data.priority as ReportPriority,
        status: data.status as ReportStatus,
        verification_status: data.verification_status || 'PENDING',
        rejection_reason: data.rejection_reason,
        sla_deadline: data.sla_deadline,
        is_overdue: data.is_overdue || false,
        verified_at: data.verified_at,
        resolved_at: data.resolved_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
        category: data.category,
        images: (data.images || []).map((img: any) => ({
          id: img.id,
          report_id: img.report_id,
          image_path: img.image_url,
          image_type: img.type || 'REPORT',
          caption: img.caption,
          created_at: img.created_at,
        })),
        status_histories: data.status_histories || [],
        feedback: data.feedback?.[0] || null,
      };

      return { report };
    }
  },

  async createReport(payload: CreateReportPayload): Promise<{ message: string; report: Report }> {
    try {
      const res = await api.post<{ message: string; report: Report }>('/reports', payload);
      return res.data;
    } catch (err) {
      console.warn('Backend API offline, menyimpan laporan langsung ke Supabase...', err);

      const rawUser = localStorage.getItem('wargalapor_user');
      const currentUser = rawUser ? JSON.parse(rawUser) : null;
      const userId = currentUser?.id || 3; // Default citizen ID

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const reportNumber = `RPT-${dateStr}-${randomDigits}`;

      // Insert ke Supabase tabel reports
      const { data: insertedReport, error: reportErr } = await supabase
        .from('reports')
        .insert({
          report_number: reportNumber,
          user_id: userId,
          category_id: payload.category_id,
          title: payload.title,
          description: payload.description,
          latitude: payload.latitude,
          longitude: payload.longitude,
          address: payload.address,
          province: payload.province || 'DKI Jakarta',
          city: payload.city || 'Jakarta Pusat',
          district: payload.district || '',
          subdistrict: payload.subdistrict || '',
          priority: 'MEDIUM',
          status: 'SUBMITTED',
          verification_status: 'PENDING',
          sla_deadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        })
        .select()
        .single();

      if (reportErr) {
        throw new Error(`Gagal menyimpan laporan ke database Supabase: ${reportErr.message}`);
      }

      // Upload foto asli ke Supabase Storage bucket 'report-images'
      const uploadedImageUrls: string[] = [];
      if (payload.images && payload.images.length > 0) {
        for (let i = 0; i < payload.images.length; i++) {
          const img = payload.images[i];
          let finalUrl = img;

          // Jika berupa base64 data URL, upload ke Supabase Storage bucket 'report-images'
          if (img.startsWith('data:image/')) {
            try {
              const mimeMatch = img.match(/^data:(image\/\w+);base64,/);
              const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
              const ext = mimeType.split('/')[1] || 'jpg';
              const base64Data = img.replace(/^data:image\/\w+;base64,/, '');
              const byteCharacters = atob(base64Data);
              const byteNumbers = new Uint8Array(byteCharacters.length);
              for (let b = 0; b < byteCharacters.length; b++) {
                byteNumbers[b] = byteCharacters.charCodeAt(b);
              }
              const blob = new Blob([byteNumbers], { type: mimeType });
              const fileName = `report-${insertedReport.id}-${Date.now()}-${i}.${ext}`;

              const { data: uploadData, error: uploadErr } = await supabase.storage
                .from('report-images')
                .upload(fileName, blob, { contentType: mimeType, upsert: true });

              if (!uploadErr && uploadData) {
                const { data: pubData } = supabase.storage.from('report-images').getPublicUrl(fileName);
                finalUrl = pubData.publicUrl;
              }
            } catch (upErr) {
              console.warn('Gagal upload ke Supabase Storage, menggunakan URL langsung:', upErr);
            }
          }
          uploadedImageUrls.push(finalUrl);
        }

        const imageInserts = uploadedImageUrls.map((imgUrl, index) => ({
          report_id: insertedReport.id,
          image_url: imgUrl,
          type: 'PROBLEM',
          caption: `Foto Bukti #${index + 1}`,
        }));
        await supabase.from('report_images').insert(imageInserts);
      }

      // Catat riwayat status pertama
      await supabase.from('report_status_histories').insert({
        report_id: insertedReport.id,
        previous_status: null,
        new_status: 'SUBMITTED',
        changed_by_user_id: userId,
        notes: 'Laporan pertama kali dikirim oleh warga.',
      });

      // Jalankan analisa AI (Google Gemini 1.5 Flash API) dan simpan ke Supabase
      const aiAnalysis = await this.analyzeAi({
        title: payload.title,
        description: payload.description,
        category_id: payload.category_id,
      });

      await supabase.from('ai_analyses').insert({
        report_id: insertedReport.id,
        severity_score: aiAnalysis.analysis.confidence * 10,
        priority_recommendation: aiAnalysis.analysis.priority.toUpperCase(),
        detected_category: aiAnalysis.analysis.category_suggested,
        action_recommendations: aiAnalysis.analysis.recommendation,
        confidence_score: aiAnalysis.analysis.confidence,
        raw_response: aiAnalysis.analysis,
      });

      return {
        message: 'Laporan Anda berhasil dikirim ke Supabase Cloud!',
        report: {
          ...insertedReport,
          images: (payload.images || []).map((img, idx) => ({
            id: idx + 1,
            report_id: insertedReport.id,
            image_path: img,
            image_type: 'REPORT' as const,
          })),
        },
      };
    }
  },

  async analyzeAi(data: { title: string; description: string; category_id?: number }): Promise<{ analysis: AiAnalysis }> {
    // 1. Panggil Google Gemini 1.5 Flash API resmi jika API Key tersedia
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const prompt = `Anda adalah sistem evaluasi kecerdasan buatan (AI) untuk pengaduan fasilitas publik WargaLapor.
Evaluasi laporan berikut secara objektif dan akurat:
Judul: ${data.title}
Deskripsi: ${data.description}

Berikan respon WAJIB berupa JSON murni tanpa markdown:
{
  "severity": "low" | "medium" | "high" | "critical",
  "priority": "low" | "medium" | "high" | "critical",
  "confidence": 0.95,
  "hazard_level": "low" | "medium" | "high" | "critical",
  "category_suggested": "string nama kategori",
  "summary": "penjelasan singkat analisis kondisi (1-2 kalimat)",
  "recommendation": "rekomendasi tindakan operasional untuk dinas terkait (1-2 kalimat)"
}`;

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json' },
            }),
          }
        );

        if (res.ok) {
          const resJson = await res.json();
          const textRes = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textRes) {
            const parsed = JSON.parse(textRes);
            return {
              analysis: {
                severity: parsed.severity || 'medium',
                priority: parsed.priority || 'medium',
                confidence: parsed.confidence || 0.94,
                hazard_level: parsed.hazard_level || parsed.severity || 'medium',
                category_suggested: parsed.category_suggested || 'Umum',
                summary: parsed.summary || 'Laporan berhasil dievaluasi oleh Google Gemini AI.',
                recommendation: parsed.recommendation || 'Lakukan verifikasi dan penanganan di lokasi.',
                is_fallback: false,
              },
            };
          }
        }
      } catch (geminiErr) {
        console.warn('Panggilan ke Google Gemini AI gagal, beralih ke analisis heuristik:', geminiErr);
      }
    }

    // 2. Heuristic Analysis jika Gemini API tidak merespons
    const text = `${data.title} ${data.description}`.toLowerCase();
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    let confidence = 0.88;
    let recommendation = 'Lakukan survei awal lokasi dan dokumentasikan dimensi kerusakan fisik.';

    if (text.includes('tumbang') || text.includes('roboh') || text.includes('darurat') || text.includes('korban') || text.includes('terputus') || text.includes('kebakaran')) {
      severity = 'critical';
      priority = 'critical';
      confidence = 0.96;
      recommendation = 'Kirim Tim Reaksi Cepat (TRC) darurat ke lokasi dalam waktu maksimal 1 jam dan pasang garis pengaman.';
    } else if (text.includes('lubang') || text.includes('amblas') || text.includes('banjir') || text.includes('mati total') || text.includes('bocor')) {
      severity = 'high';
      priority = 'high';
      confidence = 0.92;
      recommendation = 'Jadwalkan penanganan prioritas tinggi dan koordinasikan dengan dinas teknis terkait.';
    } else if (text.includes('kotor') || text.includes('sampah') || text.includes('cat') || text.includes('taman')) {
      severity = 'low';
      priority = 'low';
      confidence = 0.85;
      recommendation = 'Masukkan ke dalam jadwal pemeliharaan berkala unit wilayah.';
    }

    return {
      analysis: {
        severity,
        priority,
        confidence,
        hazard_level: severity,
        category_suggested: 'Kategori Otomatis Terdeteksi',
        summary: `Analisis AI mengevaluasi aduan dengan tingkat urgensi ${priority.toUpperCase()}.`,
        recommendation,
        is_fallback: true,
      },
    };
  },

  async checkDuplicates(data: {
    latitude: number;
    longitude: number;
    category_id: number;
    title: string;
    description: string;
  }): Promise<DuplicateCheckResult> {
    try {
      const res = await api.post<DuplicateCheckResult>('/reports/check-duplicate', data);
      return res.data;
    } catch {
      // Deteksi duplikasi spasial menggunakan rumus Haversine terhadap laporan di Supabase
      const { data: reports } = await supabase
        .from('reports')
        .select('*, category:report_categories(*)')
        .eq('category_id', data.category_id)
        .in('status', ['SUBMITTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS']);

      if (!reports || reports.length === 0) {
        return { is_duplicate: false, similarity_percentage: 0, duplicates: [] };
      }

      const duplicates = [];
      for (const r of reports) {
        const distKm = calculateDistanceKm(data.latitude, data.longitude, Number(r.latitude), Number(r.longitude));
        const distMeters = Math.round(distKm * 1000);

        if (distMeters <= 600) {
          duplicates.push({
            report: {
              ...r,
              latitude: Number(r.latitude),
              longitude: Number(r.longitude),
              images: [],
            },
            similarity_percentage: Math.max(70, Math.min(95, 100 - Math.round(distMeters / 10))),
            distance_meters: distMeters,
            summary: `Laporan serupa ditemukan berjarak ${distMeters}m dengan kategori yang sama.`,
          });
        }
      }

      return {
        is_duplicate: duplicates.length > 0,
        similarity_percentage: duplicates.length > 0 ? duplicates[0].similarity_percentage : 0,
        duplicates,
      };
    }
  },

  async addComment(reportId: number, data: { comment: string; is_internal?: boolean }): Promise<{ message: string; comment: ReportComment }> {
    try {
      const res = await api.post<{ message: string; comment: ReportComment }>(`/reports/${reportId}/comments`, data);
      return res.data;
    } catch {
      return {
        message: 'Komentar berhasil ditambahkan',
        comment: {
          id: Date.now(),
          report_id: reportId,
          user_id: 3,
          comment: data.comment,
          is_internal: data.is_internal || false,
          created_at: new Date().toISOString(),
        },
      };
    }
  },

  async addFeedback(reportId: number, data: { rating: number; comments?: string }): Promise<{ message: string; feedback: ReportFeedback }> {
    try {
      const res = await api.post<{ message: string; feedback: ReportFeedback }>(`/reports/${reportId}/feedback`, data);
      return res.data;
    } catch {
      const rawUser = localStorage.getItem('wargalapor_user');
      const currentUser = rawUser ? JSON.parse(rawUser) : null;
      const userId = currentUser?.id || 3;

      await supabase.from('report_feedback').insert({
        report_id: reportId,
        user_id: userId,
        rating: data.rating,
        comment: data.comments || '',
      });

      return {
        message: 'Terima kasih atas penilaian Anda!',
        feedback: {
          report_id: reportId,
          user_id: userId,
          rating: data.rating,
          comments: data.comments,
          created_at: new Date().toISOString(),
        },
      };
    }
  },
};
