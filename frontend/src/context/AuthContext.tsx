import React, { createContext, useContext, useEffect, useState } from 'react';
import { RegisterOtpResponse, User, VerifyOtpPayload } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (data: {
    email: string;
    password: string;
    security_token?: string;
    security_answer?: string | number;
    website_url?: string;
  }) => Promise<any>;
  register: (data: {
    name: string;
    email: string;
    phone: string;
    nik?: string;
    password: string;
    password_confirmation: string;
    security_token?: string;
    security_answer?: string | number;
    website_url?: string;
  }) => Promise<RegisterOtpResponse>;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  isAdmin: boolean;
  isOfficer: boolean;
  isCitizen: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('wargalapor_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('wargalapor_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    if (!localStorage.getItem('wargalapor_token')) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await authService.getMe();
      setUser(res.user);
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem('wargalapor_token');
      localStorage.removeItem('wargalapor_user');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (data: {
    email: string;
    password: string;
    security_token?: string;
    security_answer?: string | number;
    website_url?: string;
  }) => {
    const res = await authService.login(data);
    if ('token' in res && res.token) {
      setUser(res.user);
      setToken(res.token);
    }
    return res;
  };

  const register = async (data: {
    name: string;
    email: string;
    phone: string;
    nik?: string;
    password: string;
    password_confirmation: string;
    security_token?: string;
    security_answer?: string | number;
  }) => {
    return await authService.register(data);
  };

  const verifyOtp = async (payload: VerifyOtpPayload) => {
    const res = await authService.verifyOtp(payload);
    setUser(res.user);
    setToken(res.token);
    return res.user;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
    }
  };

  const updateUser = (updated: User) => {
    setUser(updated);
    localStorage.setItem('wargalapor_user', JSON.stringify(updated));
  };

  const isAdmin = user?.role === 'admin';
  const isOfficer = user?.role === 'officer';
  const isCitizen = user?.role === 'citizen';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        verifyOtp,
        logout,
        updateUser,
        isAdmin,
        isOfficer,
        isCitizen,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
