import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { Bell, CheckCheck, Clock } from 'lucide-react';

export const CitizenNotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notifikasi</h1>
          <p className="text-xs text-slate-500">Pemberitahuan perkembangan status laporan Anda</p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            leftIcon={<CheckCheck className="w-4 h-4 text-teal-600" />}
          >
            Tandai Semua Dibaca
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-10 h-10 text-slate-300" />}
          title="Belum Ada Notifikasi"
          description="Anda akan menerima pemberitahuan di sini saat laporan Anda diverifikasi atau diproses oleh petugas."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n.id}
              onClick={() => {
                markAsRead(n.id);
                if (n.link) navigate(n.link);
              }}
              hoverEffect
              className={`p-4.5 flex items-start gap-3.5 transition-all ${
                !n.is_read ? 'bg-teal-50/40 border-teal-200' : 'bg-white'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-teal-100 text-teal-700 shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{n.title}</h4>
                  <span className="text-[11px] text-slate-400">
                    {new Date(n.created_at).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
