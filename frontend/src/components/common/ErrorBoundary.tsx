import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Terjadi Kendala Memuat Halaman
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Sistem mendeteksi galat saat memproses data. Silakan muat ulang halaman atau kembali ke beranda.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-slate-100 rounded-xl text-left text-[11px] text-slate-600 font-mono overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2 justify-center">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={this.handleReload}
                className="w-full sm:w-auto font-bold"
              >
                Muat Ulang
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Home className="w-3.5 h-3.5" />}
                onClick={this.handleGoHome}
                className="w-full sm:w-auto font-bold"
              >
                Ke Beranda
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
