import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { Card } from '../../components/common/Card';
import { Activity, Shield, Clock, Search } from 'lucide-react';

export const AdminAuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = () => {
    setLoading(true);
    adminService
      .getAuditLogs({ search: search || undefined })
      .then((res) => setLogs(res.audit_logs.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6 text-teal-600" />
          Audit Trail Log (Jejak Aktivitas Sistem)
        </h1>
        <p className="text-xs text-slate-500">
          Catatan permanen dan tidak dapat diubah (immutable) atas seluruh aksi kritis di dalam platform
        </p>
      </div>

      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari aksi, nama aktor, entitas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase">
              <tr>
                <th className="px-5 py-4">Waktu</th>
                <th className="px-5 py-4">Aktor / Pengguna</th>
                <th className="px-5 py-4">Aksi / Event</th>
                <th className="px-5 py-4">Entitas Terkait</th>
                <th className="px-5 py-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Memuat audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Belum ada catatan log aktivitas.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-3 font-sans">
                      <span className="font-bold text-slate-900">{log.actor_name || 'Sistem'}</span>
                      <span className="ml-1 text-[10px] uppercase font-bold text-teal-700">
                        [{log.actor_role || 'sys'}]
                      </span>
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-800">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 font-sans">
                      {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                    </td>
                    <td className="px-5 py-3 text-slate-400">{log.ip_address || '127.0.0.1'}</td>
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
