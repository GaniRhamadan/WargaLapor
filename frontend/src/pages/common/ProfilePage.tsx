import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { User, Mail, Phone, IdCard, Lock, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [nik, setNik] = useState(user?.nik || '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val.startsWith('+')) {
      val = '+' + val.slice(1).replace(/\D/g, '');
    } else {
      val = val.replace(/\D/g, '');
    }
    if (val.length <= 15) {
      setPhone(val);
    }
  };

  const handleNikChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 16);
    setNik(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password && password !== passwordConfirmation) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (phone && (phone.length < 10 || phone.length > 15)) {
      setErrorMsg('Nomor telepon harus antara 10 hingga 15 digit.');
      return;
    }

    if (nik && nik.length !== 16) {
      setErrorMsg('NIK harus terdiri dari tepat 16 digit angka sesuai KTP.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.updateProfile({
        name,
        phone,
        nik,
        password: password || undefined,
        password_confirmation: passwordConfirmation || undefined,
      });
      updateUser(res.user);
      setSuccessMsg('Profil Anda berhasil diperbarui!');
      setPassword('');
      setPasswordConfirmation('');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal memperbarui profil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Profil Pengguna</h1>
        <p className="text-xs text-slate-500">Kelola informasi data pribadi dan keamanan akun Anda</p>
      </div>

      <Card className="p-6 sm:p-8 space-y-6">
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Nama Lengkap</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Email (Permanen)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Nomor Telepon</label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {phone.length}/15 digit
                </span>
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  maxLength={15}
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="Contoh: 081234567890"
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-400">Maksimal 15 digit (08... atau +628...)</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">NIK (16 Digit)</label>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                    nik.length === 16
                      ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200'
                      : nik.length > 0
                      ? 'bg-amber-50 text-amber-700 font-medium border border-amber-200'
                      : 'text-slate-400'
                  }`}
                >
                  {nik.length}/16 digit
                </span>
              </div>
              <div className="relative">
                <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={16}
                  value={nik}
                  onChange={handleNikChange}
                  placeholder="3171012304920001"
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none font-mono tracking-wide"
                />
              </div>
              {nik.length > 0 && nik.length < 16 ? (
                <p className="text-[10px] text-amber-600 font-medium">
                  NIK harus tepat 16 digit angka (kurang {16 - nik.length} digit).
                </p>
              ) : (
                <p className="text-[10px] text-slate-400">Maksimal 16 digit angka sesuai KTP</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <p className="text-xs font-bold text-slate-800">Ubah Kata Sandi (Kosongkan jika tidak ingin mengubah)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Kata Sandi Baru</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Konfirmasi Kata Sandi Baru</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" variant="primary" size="md" isLoading={loading}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
