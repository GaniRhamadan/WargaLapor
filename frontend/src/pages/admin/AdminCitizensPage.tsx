import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { User } from '../../types/auth';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Search, UserX, UserCheck, ShieldAlert } from 'lucide-react';

export const AdminCitizensPage: React.FC = () => {
  const [citizens, setCitizens] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCitizens = () => {
    setLoading(true);
    adminService
      .getCitizens({ search: search || undefined })
      .then((res) => setCitizens(res.citizens.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCitizens();
  }, []);

  const handleToggleStatus = async (id: number) => {
    await adminService.toggleUserStatus(id);
    fetchCitizens();
  };

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Data Warga Terdaftar</h1>
        <p className="text-xs text-slate-500">Direktori seluruh akun warga masyarakat terdaftar</p>
      </div>

      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nama, email, NIK..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchCitizens()}
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase">
              <tr>
                <th className="px-5 py-4">Warga</th>
                <th className="px-5 py-4">Kontak / Telepon</th>
                <th className="px-5 py-4">NIK</th>
                <th className="px-5 py-4">Status Akun</th>
                <th className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Memuat data warga...
                  </td>
                </tr>
              ) : citizens.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Tidak ada data warga.
                  </td>
                </tr>
              ) : (
                citizens.map((cit) => (
                  <tr key={cit.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">{cit.name}</p>
                      <p className="text-[11px] text-slate-400">{cit.email}</p>
                    </td>
                    <td className="px-5 py-4">{cit.phone || '-'}</td>
                    <td className="px-5 py-4 font-mono text-[11px]">{cit.nik || '-'}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          cit.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {cit.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant={cit.status === 'active' ? 'danger' : 'success'}
                        size="sm"
                        onClick={() => handleToggleStatus(cit.id)}
                      >
                        {cit.status === 'active' ? 'Nonaktifkan Akun' : 'Aktifkan Kembali'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
