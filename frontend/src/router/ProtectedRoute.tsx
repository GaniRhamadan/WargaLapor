import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth';

export const ProtectedRoute: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs text-slate-400">
        Memeriksa sesi login...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const RoleGuard: React.FC<{ allowedRoles: UserRole[] }> = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to respective home dashboard
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'officer') return <Navigate to="/officer" replace />;
    return <Navigate to="/citizen" replace />;
  }

  return <Outlet />;
};
