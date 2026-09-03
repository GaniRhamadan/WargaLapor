import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Shield, Mail, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      setSuccessMsg(res.message);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal mengirim instruksi pemulihan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-144px)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-md shadow-teal-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Pemulihan Kata Sandi
          </h2>
          <p className="text-xs text-slate-500">
            Masukkan alamat email yang terdaftar untuk menerima tautan reset kata sandi
          </p>
        </div>

        <Card className="p-6 sm:p-8 space-y-5">
          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Instruksi Terkirim</p>
                <p className="mt-0.5">{successMsg}</p>
                <div className="mt-2 pt-2 border-t border-emerald-200">
                  <Link to="/reset-password" className="font-bold text-teal-700 underline">
                    Lanjut ke Halaman Reset Kata Sandi →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Email Akun Anda</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              className="w-full font-bold shadow-md shadow-teal-500/20"
            >
              Kirim Link Pemulihan
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
            <Link to="/login" className="inline-flex items-center gap-1 font-bold text-teal-600 hover:text-teal-700">
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Halaman Masuk
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
