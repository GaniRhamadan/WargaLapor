import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Settings, Save, CheckCircle2, Bot, Phone, MapPin, Globe } from 'lucide-react';

export const AdminSystemSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    adminService
      .getSettings()
      .then((res) => setSettings(res.settings))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value } : s))
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await adminService.updateSettings(
        settings.map((s) => ({ key: s.key, value: s.value }))
      );
      setSuccessMsg('Pengaturan sistem berhasil disimpan.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-teal-600" />
          Pengaturan Sistem & Operasional
        </h1>
        <p className="text-xs text-slate-500">Konfigurasi parameter global platform WargaLapor</p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Identitas & Kontak Darurat</h3>

          <div className="space-y-3">
            {settings.map((item) => (
              <div key={item.key} className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {item.description || item.key}
                </label>
                <input
                  type="text"
                  value={item.value || ''}
                  onChange={(e) => handleChange(item.key, e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            ))}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="md" isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
            Simpan Konfigurasi Sistem
          </Button>
        </div>
      </form>
    </div>
  );
};
