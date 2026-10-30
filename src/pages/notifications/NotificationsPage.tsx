import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wallet,
  ArrowRight,
  RotateCcw,
  CheckCheck,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment_completed':
        return <Wallet className="w-5 h-5 text-emerald-600" />;
      case 'voucher_approved':
        return <CheckCircle2 className="w-5 h-5 text-indigo-600" />;
      case 'voucher_rejected':
        return <AlertCircle className="w-5 h-5 text-rose-600" />;
      case 'voucher_returned':
        return <RotateCcw className="w-5 h-5 text-amber-600" />;
      default:
        return <Clock className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Notification Center
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time workflow alerts, approval decisions, and disbursement updates
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-1.5" /> Mark All as Read
          </Button>
        )}
      </div>

      <Card className="p-0 divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No notifications yet</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Activity notifications on your claims and reviews will appear here.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                markAsRead(n.id);
                if (n.voucher_id) navigate(`/vouchers/${n.voucher_id}`);
              }}
              className={`p-4 sm:p-5 flex items-start gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                !n.is_read ? 'bg-indigo-50/30' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0">
                {getIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {n.title}
                  </h4>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">
                    {formatDateTime(n.created_at)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
              </div>

              {!n.is_read && (
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </Card>
    </div>
  );
};
