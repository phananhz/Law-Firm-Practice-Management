import type { AuditEntry, NotificationItem, ReportOverview, SearchResultSet } from '@lpms/types';
import { request } from '../api-client';

/** Platform-wide APIs are kept separate from feature clients so pages do not know transport details. */
export const platformApi = {
  getNotifications: (unreadOnly = false) =>
    request<NotificationItem[]>(`/notifications?unreadOnly=${String(unreadOnly)}`),

  markNotificationRead: (id: string) =>
    request<NotificationItem>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    request<{ updated: number }>('/notifications/read-all', { method: 'POST' }),

  search: (query: string, type?: SearchResultSet['results'][number]['type']) => {
    const params = new URLSearchParams({ q: query });
    if (type) params.set('type', type);
    return request<SearchResultSet>(`/search?${params.toString()}`);
  },

  getReportOverview: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString();
    return request<ReportOverview>(`/reports/overview${query ? `?${query}` : ''}`);
  },

  getAudit: (filters?: { module?: string; action?: string; actorId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.module) params.set('module', filters.module);
    if (filters?.action) params.set('action', filters.action);
    if (filters?.actorId) params.set('actorId', filters.actorId);
    const query = params.toString();
    return request<AuditEntry[]>(`/audit${query ? `?${query}` : ''}`);
  },
};
