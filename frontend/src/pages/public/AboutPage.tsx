import React from 'react';
import { Card } from '../../components/common/Card';
import { Shield, Target, Users, Zap, CheckCircle2, Award, HeartHandshake } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Title Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-bold text-teal-600 uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
          Tentang WargaLapor
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Membangun Ekosistem Kota Cerdas yang Responsif & Transparan
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          WargaLapor adalah platform inisiatif teknologi sipil (Civic Technology) yang menghubungkan partisipasi aktif warga dengan respon cepat jajaran dinas dan petugas teknis di lapangan.
        </p>
      </div>

      {/* 3 Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="space-y-3 p-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Visi & Misi</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Mewujudkan lingkungan kota yang aman, bersih, dan berkelanjutan melalui pelaporan partisipatif yang mudah diakses oleh seluruh lapisan masyarakat.
          </p>
        </Card>

        <Card className="space-y-3 p-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Komitmen SLA Cepat</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Setiap aduan diproses dengan standar Service Level Agreement (SLA) terukur: respon 1–4 jam untuk kasus kritis dan maksimal 72 jam untuk perawatan berkala.
          </p>
        </Card>

        <Card className="space-y-3 p-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Transparansi & Keamanan</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Data pelapor dilindungi secara ketat, sementara status pengerjaan dan bukti foto perbaikan dapat dipantau secara terbuka oleh masyarakat.
          </p>
        </Card>
      </div>

      {/* Values Section */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 space-y-6">
        <h2 className="text-2xl font-bold">Prinsip Kerja Kami</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-slate-300">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" /> Partisipatif
            </div>
            <p>Mendorong setiap warga menjadi mata dan telinga penjaga kualitas kota.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" /> Cerdas AI
            </div>
            <p>Memanfaatkan analisis mesin cerdas untuk memprioritaskan masalah genting.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" /> Akuntabel
            </div>
            <p>Semua tindak lanjut dicatat dalam jejak audit log yang tidak dapat diubah.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" /> Berbasis Bukti
            </div>
            <p>Penyelesaian tugas wajib diverifikasi dengan foto hasil pengerjaan nyata.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
