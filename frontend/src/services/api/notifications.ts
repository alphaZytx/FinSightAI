import type { Notification } from '../../types';
import { apiFetch } from './client';

export async function listNotifications(workspaceId: string): Promise<Notification[]> {
  return await apiFetch<Notification[]>(`/notifications?workspace_id=${workspaceId}`);
}

export async function markNotificationAsRead(notificationId: string): Promise<{ status: string; read: boolean }> {
  return await apiFetch<{ status: string; read: boolean }>(`/notifications/${notificationId}/read`, {
    method: 'PUT',
  });
}
