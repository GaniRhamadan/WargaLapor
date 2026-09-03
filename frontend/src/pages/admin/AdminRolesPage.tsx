import React from 'react';
import { Card } from '../../components/common/Card';
import { Shield, Users, HardHat, Check } from 'lucide-react';

export const AdminRolesPage: React.FC = () => {
  const matrix = [
    { module: 'Membuat Laporan Baru (Wizard + GPS)', citizen: true, officer: false, admin: true },
    { module: 'Melihat Peta Publik Laporan', citizen: true, officer: true, admin: true },
    { module: 'Memberikan Feedback Rating (1-5 Bintang)', citizen: true, officer: false, admin: true },
    { module: 'Melihat & Menangani Tugas Lapangan', citizen: false, officer: true, admin: true },
    { module: 'Mengubah Status Lapangan & Upload Bukti', citizen: false, officer: true, admin: true },
    { module: 'Verifikasi & Menolak Aduan Warga', citizen: false, officer: false, admin: true },
    { module: 'Menugaskan Petugas Lapangan (Assign)', citizen: false, officer: false, admin: true },
    { module: 'Manajemen Data Pengguna & Kategori', citizen: false, officer: false, admin: true },
    { module: 'Melihat Heatmap Masalah & Analytics', citizen: false, officer: false, admin: true },
    { module: 'Melihat Audit Trail Log Sistem', citizen: false, officer: false, admin: true },
    { module: 'Mengubah Konfigurasi SLA & Parameter', citizen: false, officer: false, admin: true },
  ];

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Shield className="w-6 h-6 text-teal-600" />
          Role-Based Access Control (RBAC Matrix)
        </h1>
        <p className="text-xs text-slate-500">Struktur hak akses dan izin wewenang sistem WargaLapor</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-5 space-y-2 border-teal-200 bg-teal-50/20">
          <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
            <Users className="w-4 h-4" />
            <h3>Role: Warga Masyarakat</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Akses publik untuk mendaftar, membuat laporan foto + GPS, memantau status pengerjaan, dan memberi feedback bintang.
          </p>
        </Card>

        <Card className="p-5 space-y-2 border-amber-200 bg-amber-50/20">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <HardHat className="w-4 h-4" />
            <h3>Role: Petugas Lapangan (TRC)</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Akses operasional lapangan untuk menerima penugasan, update status pengerjaan, dan mengunggah foto bukti penyelesaian.
          </p>
        </Card>

        <Card className="p-5 space-y-2 border-purple-200 bg-purple-50/20">
          <div className="flex items-center gap-2 text-purple-800 font-bold text-sm">
            <Shield className="w-4 h-4" />
            <h3>Role: Administrator Utama</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Akses penuh untuk memverifikasi laporan, delegasi penugasan petugas, manajemen data master, analytics kota, dan audit log.
          </p>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase">
              <tr>
                <th className="px-5 py-3.5">Modul / Izin Akses</th>
                <th className="px-5 py-3.5 text-center">Warga</th>
                <th className="px-5 py-3.5 text-center">Petugas</th>
                <th className="px-5 py-3.5 text-center">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-slate-800">{row.module}</td>
                  <td className="px-5 py-3 text-center">
                    {row.citizen ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {row.officer ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {row.admin ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
