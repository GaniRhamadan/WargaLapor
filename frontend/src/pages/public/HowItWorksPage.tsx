import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import {
  Camera,
  Tag,
  FileText,
  MapPin,
  Bot,
  FileCheck,
  HardHat,
  CheckCircle2,
  Star,
  ArrowRight,
  Shield,
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Unggah Foto Bukti & Detail Masalah',
      desc: 'Ambil foto langsung di lokasi kejadian menggunakan kamera smartphone Anda. Berikan judul dan deskripsi singkat mengenai kondisi kerusakan.',
      icon: <Camera className="w-6 h-6 text-teal-600" />,
      detail: 'Mendukung upload format JPG/PNG/WEBP hingga beberapa foto.',
    },
    {
      num: '02',
      title: 'Pilih Kategori & Tentukan Titik GPS',
      desc: 'Pilih kategori masalah (Jalan Rusak, Sampah, Lampu PJU, Banjir, dsb). Sistem otomatis mengunci koordinat GPS dan mengisi nama jalan terdekat.',
      icon: <MapPin className="w-6 h-6 text-blue-600" />,
      detail: 'Pin peta dapat digeser secara manual jika berada di lokasi tertutup.',
    },
    {
      num: '03',
      title: 'Analisis AI & Pemeriksaan Duplikasi',
      desc: 'Sebelum dikirim, Google Gemini AI mengevaluasi tingkat keparahan masalah dan memeriksa apakah sudah ada warga lain yang melaporkan titik yang sama.',
      icon: <Bot className="w-6 h-6 text-purple-600" />,
      detail: 'Mencegah laporan ganda dan langsung memberikan estimasi prioritas.',
    },
    {
      num: '04',
      title: 'Verifikasi Administrator & Penugasan',
      desc: 'Admin memvalidasi keabsahan laporan dalam hitungan jam, lalu menugaskan petugas teknis (Dinas Bina Marga, DLH, Dishub, atau TRC SDA) sesuai zona.',
      icon: <HardHat className="w-6 h-6 text-amber-600" />,
      detail: 'Warga mendapatkan notifikasi instan begitu petugas ditugaskan.',
    },
    {
      num: '05',
      title: 'Penanganan Lapangan & Upload Foto Bukti',
      desc: 'Petugas datang ke lokasi, melakukan perbaikan, dan wajib mengunggah foto bukti hasil pengerjaan sebelum dapat menandai laporan SELESAI.',
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
      detail: 'Foto bukti dapat dilihat langsung oleh pelapor dan publik.',
    },
    {
      num: '06',
      title: 'Warga Memberikan Rating & Ulasan',
      desc: 'Setelah laporan selesai, pelapor memberikan penilaian bintang 1–5 serta komentar untuk menjaga kualitas pelayanan publik.',
      icon: <Star className="w-6 h-6 text-amber-500" />,
      detail: 'Rating masyarakat menjadi KPI evaluasi kinerja dinas terkait.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold text-teal-600 uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
          Panduan Lengkap
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Cara Kerja & Alur Transparansi WargaLapor
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          Dari warga melapor hingga masalah tuntas dibereskan oleh petugas lapangan. Transparan, terukur, dan berbasis data nyata.
        </p>
      </div>

      {/* Step by Step List */}
      <div className="space-y-6">
        {steps.map((s, idx) => (
          <div
            key={idx}
            className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center gap-6"
          >
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-3xl font-black text-teal-600 w-10">{s.num}</span>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center">
                {s.icon}
              </div>
            </div>

            <div className="flex-1 space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">{s.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
              <p className="text-[11px] font-semibold text-teal-700 bg-teal-50/60 px-2.5 py-1 rounded-lg inline-block">
                ℹ️ {s.detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Box */}
      <div className="p-8 bg-slate-900 text-white rounded-3xl text-center space-y-4">
        <h3 className="text-xl font-bold">Siap Melaporkan Masalah di Lingkungan Anda?</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Mulai laporkan sekarang dalam waktu kurang dari 2 menit.
        </p>
        <Link to="/citizen/create-report">
          <Button variant="primary" size="md">
            Mulai Buat Laporan
          </Button>
        </Link>
      </div>
    </div>
  );
};
