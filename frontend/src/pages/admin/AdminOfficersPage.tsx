import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { Officer } from '../../types/officer';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { HardHat, Plus, Search, CheckCircle2, Phone, Mail, User } from 'lucide-react';

export const AdminOfficersPage: React.FC = () => {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Officer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Dinas Bina Marga & Sumber Daya Air');
  const [unit, setUnit] = useState('Tim Reaksi Cepat 01');
  const [areaCoverage, setAreaCoverage] = useState('Jakarta Pusat');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOfficers = () => {
    setLoading(true);
    adminService
      .getOfficers({ search: search || undefined })
      .then((res) => setOfficers(res.officers))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOfficers();
  }, []);

  const handleAddOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await adminService.createOfficer({
        name,
        email,
        phone,
        password,
        department,
        unit,
        area_coverage: areaCoverage,
      });
      setShowAddModal(false);
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      fetchOfficers();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Petugas Lapangan
          </h1>
          <p className="text-xs text-slate-500">
            Daftar petugas teknis, beban kerja aktif, dan penambahan personil baru
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setShowAddModal(true)}
        >
          Tambah Petugas Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {officers.map((off) => (
          <Card key={off.id} className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                  {off.user?.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{off.user?.name}</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                    {off.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 border-y border-slate-100 py-3">
              <p className="font-semibold text-slate-800">{off.department}</p>
              <p className="text-[11px] text-slate-500">{off.unit || 'Tim Reaksi Cepat'}</p>
              <p className="text-[11px] text-slate-400">Wilayah: {off.area_coverage || 'Semua Wilayah'}</p>
            </div>

            {/* Workload Stats */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-[10px] text-amber-800 font-semibold">Tugas Aktif</p>
                <p className="text-base font-bold text-amber-900">{off.active_tasks_count}</p>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-[10px] text-emerald-800 font-semibold">Selesai</p>
                <p className="text-base font-bold text-emerald-900">{off.completed_tasks_count}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ADD OFFICER MODAL */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Tambah Petugas Lapangan Baru"
        maxWidth="lg"
      >
        <form onSubmit={handleAddOfficer} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Nama Petugas *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Rian Hidayat"
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Alamat Email Login *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="petugas@wargalapor.test"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Nomor Telepon / WhatsApp</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="081288990000"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Kata Sandi Akun *</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Dinas / Instansi *</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="Dinas Bina Marga & Sumber Daya Air">Dinas Bina Marga & SDA</option>
                <option value="Dinas Lingkungan Hidup (DLH)">Dinas Lingkungan Hidup (DLH)</option>
                <option value="Dinas Perhubungan & Penerangan Jalan">Dinas Perhubungan (Dishub)</option>
                <option value="Satuan Polisi Pamong Praja (Satpol PP)">Satpol PP & Ketertiban</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Unit Kerja / TRC</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Contoh: TRC 01 Jalan & Jembatan"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Simpan & Daftarkan Petugas
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
