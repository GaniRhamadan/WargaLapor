import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, PhoneCall, Mail, MapPin, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1 & 2: Branding & Tagline */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500 flex items-center justify-center text-slate-900 shadow-md">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Warga<span className="text-teal-400">Lapor</span>
              </span>
            </div>
            <p className="text-slate-300 font-medium text-sm">
              “Laporkan Masalah. Pantau Prosesnya. Bangun Lingkungan Lebih Baik.”
            </p>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Platform Smart Citizen Reporting berbasis AI terintegrasi untuk mempercepat respon perbaikan fasilitas umum, infrastruktur kota, dan layanan lingkungan hidup.
            </p>
            <div className="pt-2 flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-teal-400 font-semibold">
                <PhoneCall className="w-4 h-4" /> Darurat: 112
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4" /> aduan@wargalapor.go.id
              </span>
            </div>
          </div>

          {/* Col 3: Layanan Publik */}
          <div className="space-y-3">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider">Layanan</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/citizen/create-report" className="hover:text-teal-400 transition-colors">
                  Buat Laporan Warga
                </Link>
              </li>
              <li>
                <Link to="/public/map" className="hover:text-teal-400 transition-colors">
                  Peta Laporan Publik
                </Link>
              </li>
              <li>
                <Link to="/public/stats" className="hover:text-teal-400 transition-colors">
                  Transparansi & Statistik
                </Link>
              </li>
              <li>
                <Link to="/public/how-it-works" className="hover:text-teal-400 transition-colors">
                  Panduan & Cara Kerja
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Kategori Populer */}
          <div className="space-y-3">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider">Kategori Masalah</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="hover:text-slate-200">Jalan Rusak & Berlubang</span></li>
              <li><span className="hover:text-slate-200">Sampah & Kebersihan</span></li>
              <li><span className="hover:text-slate-200">Lampu Jalan & PJU</span></li>
              <li><span className="hover:text-slate-200">Banjir & Drainase Mampet</span></li>
              <li><span className="hover:text-slate-200">Pohon Tumbang Rawan</span></li>
            </ul>
          </div>

          {/* Col 5: Akun & Portal */}
          <div className="space-y-3">
            <h4 className="text-white text-sm font-bold uppercase tracking-wider">Akses Portal</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/login" className="hover:text-teal-400 transition-colors">
                  Masuk Akun Warga
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-teal-400 transition-colors">
                  Daftar Warga Baru
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-teal-400 transition-colors">
                  Portal Petugas TRC
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-teal-400 transition-colors">
                  Dashboard Administrator
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} WargaLapor — Sistem Smart Citizen Reporting Kota Indonesia. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Dirancang dengan</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>untuk tata kelola kota yang lebih bersih dan aman.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
