import type {
  AuditEntry,
  NotificationItem,
  ReportOverview,
  SearchResultItem,
  SearchResultSet,
} from '@lpms/types';

export type PlatformUserContext = { userId?: string; roles?: string[] };

export interface PlatformRepository {
  listNotifications(
    unreadOnly?: boolean,
    context?: PlatformUserContext,
  ): NotificationItem[] | Promise<NotificationItem[]>;
  markNotificationRead(
    id: string,
    context?: PlatformUserContext,
  ): NotificationItem | Promise<NotificationItem>;
  markAllNotificationsRead(
    context?: PlatformUserContext,
  ): { updated: number } | Promise<{ updated: number }>;
  search(
    query: string,
    type?: SearchResultItem['type'],
    context?: PlatformUserContext,
  ): SearchResultSet | Promise<SearchResultSet>;
  reportOverview(
    from?: string,
    to?: string,
    context?: PlatformUserContext,
  ): ReportOverview | Promise<ReportOverview>;
  listAudit(filters: {
    module?: string;
    action?: string;
    actorId?: string;
  }): AuditEntry[] | Promise<AuditEntry[]>;
}

export const PLATFORM_REPOSITORY = Symbol('PLATFORM_REPOSITORY');
