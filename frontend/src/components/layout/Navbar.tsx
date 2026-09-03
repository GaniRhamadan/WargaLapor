import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Bell,
  CheckCircle,
  ChevronDown,
  Compass,
  FileText,
  LogOut,
  MapPin,
  Menu,
  PlusCircle,
  Shield,
  User as UserIcon,
  X,
} from 'lucide-react';
import { Button } from '../common/Button';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin, isOfficer, isCitizen } = useAuth();
  const { unreadCount, notifications, markAsRead } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (isAdmin) return '/admin';
    if (isOfficer) return '/officer';
    return '/citizen';
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-header border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1">
                Warga<span className="text-teal-600">Lapor</span>
                <span className="inline-block w-2 h-2 rounded-full bg-teal-500 ml-0.5"></span>
              </span>
              <p className="text-[10px] font-semibold text-slate-400 -mt-1 hidden sm:block tracking-wider uppercase">
                Smart Citizen Reporting
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-7">
            <Link
              to="/"
              className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors"
            >
              Beranda
            </Link>
            <Link
              to="/public/map"
              className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4 text-teal-600" />
              Peta Publik
            </Link>
            <Link
              to="/public/how-it-works"
              className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors"
            >
              Cara Kerja
            </Link>
            <Link
              to="/public/stats"
              className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors"
            >
              Statistik Kota
            </Link>
            <Link
              to="/public/about"
              className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors"
            >
              Tentang Kami
            </Link>
          </nav>

          {/* Action CTAs & Auth Controls */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                {/* Notification Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotifDropdownOpen(!notifDropdownOpen);
                      setUserDropdownOpen(false);
                    }}
                    className="p-2 rounded-xl text-slate-600 hover:text-teal-600 hover:bg-slate-100 transition-colors relative cursor-pointer"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                        <h4 className="text-sm font-bold text-slate-800">Notifikasi ({unreadCount})</h4>
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400">
                            Belum ada notifikasi baru.
                          </div>
                        ) : (
                          notifications.slice(0, 5).map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                markAsRead(n.id);
                                if (n.link) navigate(n.link);
                                setNotifDropdownOpen(false);
                              }}
                              className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-left ${
                                !n.is_read ? 'bg-teal-50/40' : ''
                              }`}
                            >
                              <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dashboard CTA */}
                <Link to={getDashboardPath()} className="hidden sm:inline-block">
                  <Button variant="outline" size="sm">
                    Dashboard {isAdmin ? 'Admin' : isOfficer ? 'Petugas' : 'Warga'}
                  </Button>
                </Link>

                {/* Report Wizard CTA for Citizen */}
                {isCitizen && (
                  <Link to="/citizen/create-report" className="hidden sm:inline-block">
                    <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                      Buat Laporan
                    </Button>
                  </Link>
                )}

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(!userDropdownOpen);
                      setNotifDropdownOpen(false);
                    }}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center border border-teal-200">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-2 py-0.5 bg-teal-50 text-teal-700 rounded-md">
                          {user.role}
                        </span>
                      </div>
                      <Link
                        to={getDashboardPath()}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Shield className="w-4 h-4 text-slate-400" />
                        Dashboard
                      </Link>
                      <Link
                        to={`/${user.role}/profile`}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        Profil Saya
                      </Link>
                      <div className="my-1 border-t border-slate-100" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        Keluar Akun
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Masuk
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Daftar Warga
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl md:hidden text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/80 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 hover:text-teal-600"
          >
            Beranda
          </Link>
          <Link
            to="/public/map"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 hover:text-teal-600"
          >
            Peta Laporan Publik
          </Link>
          <Link
            to="/public/how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 hover:text-teal-600"
          >
            Cara Kerja
          </Link>
          <Link
            to="/public/stats"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 hover:text-teal-600"
          >
            Statistik Kota
          </Link>
          <Link
            to="/public/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 hover:text-teal-600"
          >
            Tentang Kami
          </Link>
          {user && isCitizen && (
            <div className="pt-2">
              <Link to="/citizen/create-report" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" size="md" className="w-full">
                  Buat Laporan Baru
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
