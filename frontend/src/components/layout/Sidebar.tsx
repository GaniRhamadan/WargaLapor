import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle,
  Compass,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Flame,
  HardHat,
  History,
  Home,
  Layers,
  LayoutDashboard,
  LogOut,
  Map,
  MapPin,
  PlusCircle,
  Settings,
  Shield,
  ShieldAlert,
  Sliders,
  Tag,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { WargaLaporLogo } from '../common/WargaLaporLogo';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { user, logout, isAdmin, isOfficer, isCitizen } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  const linkClass = (path: string, exact = false) => {
    const active = isActive(path, exact);
    return `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
      active
        ? 'bg-teal-600 text-white shadow-sm font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-18 px-5 border-b border-slate-100 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo-icon.png" alt="WargaLapor Logo" className="w-8.5 h-8.5 object-contain shrink-0" />
            <div>
              <span className="text-base font-black tracking-tight text-slate-900 leading-tight block">
                Warga<span className="text-teal-600">Lapor</span>
              </span>
              <span className="inline-block text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md uppercase tracking-wider border border-teal-100/80">
                {isAdmin ? 'Portal Admin' : isOfficer ? 'Portal Petugas' : 'Portal Warga'}
              </span>
            </div>
          </Link>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {/* CITIZEN MENU */}
          {isCitizen && (
            <div className="space-y-1">
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Menu Utama Warga
              </p>
              <Link to="/citizen" className={linkClass('/citizen', true)} onClick={onCloseMobile}>
                <LayoutDashboard className="w-4 h-4" />
                Dashboard Warga
              </Link>
              <Link to="/citizen/create-report" className={linkClass('/citizen/create-report')} onClick={onCloseMobile}>
                <PlusCircle className="w-4 h-4 text-emerald-500" />
                Buat Laporan Baru
              </Link>
              <Link to="/citizen/reports" className={linkClass('/citizen/reports')} onClick={onCloseMobile}>
                <FileText className="w-4 h-4" />
                Laporan Saya
              </Link>
              <Link to="/citizen/map" className={linkClass('/citizen/map')} onClick={onCloseMobile}>
                <Compass className="w-4 h-4" />
                Peta Laporan Sekitar
              </Link>
              <Link to="/citizen/notifications" className={linkClass('/citizen/notifications')} onClick={onCloseMobile}>
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-3">
                    <AlertCircle className="w-4 h-4" />
                    Notifikasi
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </Link>
              <Link to="/citizen/profile" className={linkClass('/citizen/profile')} onClick={onCloseMobile}>
                <Users className="w-4 h-4" />
                Profil Saya
              </Link>
              <Link to="/citizen/settings" className={linkClass('/citizen/settings')} onClick={onCloseMobile}>
                <Settings className="w-4 h-4" />
                Pengaturan Akun
              </Link>
            </div>
          )}

          {/* OFFICER MENU */}
          {isOfficer && (
            <div className="space-y-1">
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Penugasan Lapangan
              </p>
              <Link to="/officer" className={linkClass('/officer', true)} onClick={onCloseMobile}>
                <LayoutDashboard className="w-4 h-4" />
                Dashboard Petugas
              </Link>
              <Link to="/officer/tasks" className={linkClass('/officer/tasks')} onClick={onCloseMobile}>
                <HardHat className="w-4 h-4" />
                Daftar Tugas Saya
              </Link>
              <Link to="/officer/map" className={linkClass('/officer/map')} onClick={onCloseMobile}>
                <MapPin className="w-4 h-4" />
                Peta Tugas Lapangan
              </Link>
              <Link to="/officer/history" className={linkClass('/officer/history')} onClick={onCloseMobile}>
                <History className="w-4 h-4" />
                Riwayat Selesai
              </Link>
              <Link to="/officer/notifications" className={linkClass('/officer/notifications')} onClick={onCloseMobile}>
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-3">
                    <AlertCircle className="w-4 h-4" />
                    Notifikasi
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </Link>
              <Link to="/officer/profile" className={linkClass('/officer/profile')} onClick={onCloseMobile}>
                <Users className="w-4 h-4" />
                Profil Petugas
              </Link>
            </div>
          )}

          {/* ADMIN MENU */}
          {isAdmin && (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Operasional Laporan
                </p>
                <Link to="/admin" className={linkClass('/admin', true)} onClick={onCloseMobile}>
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard Admin
                </Link>
                <Link to="/admin/verification" className={linkClass('/admin/verification')} onClick={onCloseMobile}>
                  <FileCheck className="w-4 h-4 text-amber-500" />
                  Verifikasi Masuk
                </Link>
                <Link to="/admin/reports" className={linkClass('/admin/reports')} onClick={onCloseMobile}>
                  <FileSpreadsheet className="w-4 h-4" />
                  Semua Laporan
                </Link>
              </div>

              <div className="space-y-1">
                <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Peta & Geospasial
                </p>
                <Link to="/admin/map" className={linkClass('/admin/map')} onClick={onCloseMobile}>
                  <Map className="w-4 h-4" />
                  Peta Sebaran Laporan
                </Link>
                <Link to="/admin/heatmap" className={linkClass('/admin/heatmap')} onClick={onCloseMobile}>
                  <Flame className="w-4 h-4 text-rose-500" />
                  Heatmap Masalah
                </Link>
                <Link to="/admin/analytics" className={linkClass('/admin/analytics')} onClick={onCloseMobile}>
                  <BarChart3 className="w-4 h-4 text-teal-600" />
                  Analytics & SLA
                </Link>
              </div>

              <div className="space-y-1">
                <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Manajemen Pengguna
                </p>
                <Link to="/admin/officers" className={linkClass('/admin/officers')} onClick={onCloseMobile}>
                  <HardHat className="w-4 h-4" />
                  Petugas Lapangan
                </Link>
                <Link to="/admin/citizens" className={linkClass('/admin/citizens')} onClick={onCloseMobile}>
                  <Users className="w-4 h-4" />
                  Data Warga
                </Link>
                <Link to="/admin/categories" className={linkClass('/admin/categories')} onClick={onCloseMobile}>
                  <Tag className="w-4 h-4" />
                  Kategori Masalah
                </Link>
              </div>

              <div className="space-y-1">
                <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Sistem & Konfigurasi
                </p>
                <Link to="/admin/sla-settings" className={linkClass('/admin/sla-settings')} onClick={onCloseMobile}>
                  <Sliders className="w-4 h-4" />
                  Aturan SLA Prioritas
                </Link>
                <Link to="/admin/audit-logs" className={linkClass('/admin/audit-logs')} onClick={onCloseMobile}>
                  <Activity className="w-4 h-4" />
                  Audit Trail Log
                </Link>
                <Link to="/admin/roles" className={linkClass('/admin/roles')} onClick={onCloseMobile}>
                  <ShieldAlert className="w-4 h-4" />
                  Role & Permissions
                </Link>
                <Link to="/admin/settings" className={linkClass('/admin/settings')} onClick={onCloseMobile}>
                  <Settings className="w-4 h-4" />
                  Pengaturan Sistem
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center shrink-0 border border-teal-200">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Keluar"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
