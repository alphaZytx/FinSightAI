import { Bell, CheckCircle, Info, AlertTriangle, XCircle } from 'lucide-react';
import type { Notification } from '../../types';
import { mockNotifications } from '../../services/mockData';
import { formatRelativeTime } from '../../utils/formatters';
import { Card } from '../Common';

const typeConfig = {
  success: { icon: CheckCircle, color: 'text-emerald-400' },
  info: { icon: Info, color: 'text-blue-400' },
  warning: { icon: AlertTriangle, color: 'text-amber-400' },
  error: { icon: XCircle, color: 'text-red-400' },
};

interface NotificationsPanelProps {
  notifications?: Notification[];
}

export default function NotificationsPanel({ notifications = mockNotifications }: NotificationsPanelProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Card
      title="Notifications"
      subtitle={`${unreadCount} unread`}
      action={
        <Bell className="h-4 w-4 text-muted-foreground" />
      }
    >
      <div className="space-y-2">
        {notifications.map((notification) => {
          const config = typeConfig[notification.type];
          const Icon = config.icon;
          return (
            <div
              key={notification.id}
              className={`flex items-start gap-3 rounded-lg p-3 transition-colors ${
                notification.read
                  ? 'bg-card'
                  : 'border border-primary-500/20 bg-primary-500/5'
              }`}
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.color}`} />
              <div className="min-w-0 flex-1">
                <p className={`text-sm ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {notification.message}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatRelativeTime(notification.timestamp)}
                </p>
              </div>
              {!notification.read && (
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary-400" />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
