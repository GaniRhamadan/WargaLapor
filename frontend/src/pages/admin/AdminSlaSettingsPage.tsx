import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { PriorityBadge } from '../../components/common/Badge';
import { Clock, Sliders, CheckCircle2, Save } from 'lucide-react';

export const AdminSlaSettingsPage: React.FC = () => {
  const [slaList, setSlaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    adminService
      .getSlaSettings()
      .then((res) => setSlaList(res.sla_settings))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (id: number, field: string, val: any) => {
    setSlaList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
  };

  const handleSave = async (item: any) => {
    setSavingId(item.id);
    setSuccessMsg(null);
    try {
      await adminService.updateSlaSetting(item.id, {
        response_time_hours: Number(item.response_time_hours),
        resolution_time_hours: Number(item.resolution_time_hours),
        description: item.description,
      });
      setSuccessMsg(`Aturan SLA untuk prioritas ${item.priority} berhasil disimpan.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Sliders className="w-6 h-6 text-teal-600" />
          Konfigurasi Aturan SLA Prioritas
        </h1>
        <p className="text-xs text-slate-500">
          Tentukan batas waktu respon dan batas waktu penyelesaian maksimal berdasarkan tingkat keparahan aduan
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="space-y-4">
        {slaList.map((item) => (
          <Card key={item.id} className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <PriorityBadge priority={item.priority} size="md" />
              <Button
                variant="primary"
                size="sm"
                isLoading={savingId === item.id}
                leftIcon={<Save className="w-3.5 h-3.5" />}
                onClick={() => handleSave(item)}
              >
                Simpan SLA
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Batas Waktu Respon Verifikasi (Jam)
                </label>
                <input
                  type="number"
                  min={1}
                  max={720}
                  value={item.response_time_hours}
                  onChange={(e) => handleChange(item.id, 'response_time_hours', e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Batas Waktu Penyelesaian Tuntas (Jam)
                </label>
                <input
                  type="number"
                  min={1}
                  max={720}
                  value={item.resolution_time_hours}
                  onChange={(e) => handleChange(item.id, 'resolution_time_hours', e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Deskripsi Kasus Cakupan</label>
              <input
                type="text"
                value={item.description || ''}
                onChange={(e) => handleChange(item.id, 'description', e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
