import { Bell, CheckCircle, Info, AlertTriangle, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Notification } from '../../types';
import { formatRelativeTime } from '../../utils/formatters';
import { Card } from '../Common';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { listNotifications, markNotificationAsRead } from '../../services/api/notifications';

const typeConfig = {
  success: { icon: CheckCircle, color: 'text-success-foreground' },
  info: { icon: Info, color: 'text-info-foreground' },
  warning: { icon: AlertTriangle, color: 'text-warning-foreground' },
  error: { icon: XCircle, color: 'text-error-foreground' },
};

export default function NotificationsPanel() {
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', activeWorkspaceId],
    queryFn: () => listNotifications(activeWorkspaceId!),
    enabled: Boolean(activeWorkspaceId),
    refetchInterval: 10000, // Poll every 10 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: (_, id) => {
      // Optimistically update the cache
      queryClient.setQueryData(['notifications', activeWorkspaceId], (old: Notification[] | undefined) => {
        if (!old) return old;
        return old.map(n => n.id === id ? { ...n, read: true } : n);
      });
    }
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Card
      title="Notifications"
      subtitle={`${unreadCount} unread`}
      action={
        <Bell className="h-4 w-4 text-muted-foreground" />
      }
    >
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No notifications yet.</p>
        ) : (
          notifications.map((notification) => {
            const config = typeConfig[notification.type] || typeConfig.info;
            const Icon = config.icon;
            return (
              <div
                key={notification.id}
                onClick={() => !notification.read && markAsReadMutation.mutate(notification.id)}
                className={`flex items-start gap-3 rounded-lg p-3 transition-colors ${
                  !notification.read ? 'cursor-pointer hover:bg-primary-500/10' : ''
                } ${
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
          })
        )}
      </div>
    </Card>
  );
}
