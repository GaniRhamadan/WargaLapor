import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Bell, Globe, Shield, Smartphone, Check } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [slaAlerts, setSlaAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pengaturan Akun</h1>
        <p className="text-xs text-slate-500">Konfigurasi preferensi notifikasi dan akun</p>
      </div>

      <Card className="p-6 sm:p-8 space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-teal-600" />
            Preferensi Notifikasi
          </h3>

          <div className="space-y-3 divide-y divide-slate-100 text-xs">
            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="font-bold text-slate-800">Notifikasi Push Browser</p>
                <p className="text-slate-500">Terima pemberitahuan langsung saat status laporan berubah</p>
              </div>
              <input
                type="checkbox"
                checked={pushNotif}
                onChange={(e) => setPushNotif(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="font-bold text-slate-800">Pemberitahuan Email</p>
                <p className="text-slate-500">Kirim ringkasan laporan dan bukti penyelesaian ke email</p>
              </div>
              <input
                type="checkbox"
                checked={emailNotif}
                onChange={(e) => setEmailNotif(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="font-bold text-slate-800">Peringatan Kritis & SLA</p>
                <p className="text-slate-500">Terima notifikasi darurat untuk laporan berstatus Kritis</p>
              </div>
              <input
                type="checkbox"
                checked={slaAlerts}
                onChange={(e) => setSlaAlerts(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          {saved && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <Check className="w-4 h-4" /> Pengaturan berhasil disimpan!
            </span>
          )}
          <div className="ml-auto">
            <Button type="button" variant="primary" size="sm" onClick={handleSave}>
              Simpan Pengaturan
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
