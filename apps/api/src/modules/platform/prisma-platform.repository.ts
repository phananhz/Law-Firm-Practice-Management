import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  AuditEntry,
  NotificationItem,
  NotificationTone,
  ReportOverview,
  SearchResultItem,
  SearchResultSet,
} from '@lpms/types';
import { PrismaService } from '../../database/prisma.service';
import type { PlatformRepository, PlatformUserContext } from './platform.repository';

@Injectable()
export class PrismaPlatformRepository implements PlatformRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listNotifications(
    unreadOnly = false,
    context?: PlatformUserContext,
  ): Promise<NotificationItem[]> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        ...(isUuid(context?.userId) ? { userId: context?.userId } : {}),
        ...(unreadOnly ? { isRead: false } : {}),
      },
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return notifications.map((item) => ({
      id: item.id,
      title: item.title,
      message: item.message,
      tone: notificationTone(item.type),
      readAt: item.readAt?.toISOString(),
      createdAt: item.createdAt.toISOString(),
      href: item.link ?? undefined,
      actorName: item.user.fullName,
    }));
  }

  async markNotificationRead(id: string, context?: PlatformUserContext): Promise<NotificationItem> {
    if (!isUuid(id)) throw new NotFoundException('Không tìm thấy thông báo.');
    const item = await this.prisma.notification.findFirst({
      where: { id, ...(isUuid(context?.userId) ? { userId: context?.userId } : {}) },
      include: { user: { select: { fullName: true } } },
    });
    if (!item) throw new NotFoundException('Không tìm thấy thông báo.');
    const updated = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
      include: { user: { select: { fullName: true } } },
    });
    return this.toNotification(updated);
  }

  async markAllNotificationsRead(context?: PlatformUserContext): Promise<{ updated: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { isRead: false, ...(isUuid(context?.userId) ? { userId: context?.userId } : {}) },
      data: { isRead: true, readAt: new Date() },
    });
    return { updated: result.count };
  }

  async search(
    query: string,
    type?: SearchResultItem['type'],
    context?: PlatformUserContext,
  ): Promise<SearchResultSet> {
    const auth = this.requireContext(context);
    const matterScope = this.matterScope(auth);
    const normalized = query.trim().toLowerCase();
    const [clients, matters, tasks, documents, deadlines] = await Promise.all([
      !type || type === 'CLIENT'
        ? this.prisma.client.findMany({
            where: { deletedAt: null },
            select: { id: true, clientCode: true, displayName: true },
          })
        : Promise.resolve([]),
      !type || type === 'MATTER'
        ? this.prisma.matter.findMany({
            where: { deletedAt: null, ...matterScope },
            select: { id: true, matterCode: true, name: true },
          })
        : Promise.resolve([]),
      !type || type === 'TASK'
        ? this.prisma.task.findMany({
            where: { deletedAt: null, matter: { is: matterScope } },
            select: { id: true, title: true, matter: { select: { matterCode: true } } },
          })
        : Promise.resolve([]),
      !type || type === 'DOCUMENT'
        ? this.prisma.document.findMany({
            where: { deletedAt: null, matter: { is: matterScope } },
            select: {
              id: true,
              title: true,
              isRestricted: true,
              isSensitive: true,
              permissions: {
                select: { permission: true, userId: true, role: { select: { name: true } } },
              },
              matter: { select: { matterCode: true } },
            },
          })
        : Promise.resolve([]),
      !type || type === 'DEADLINE'
        ? this.prisma.deadline.findMany({
            where: { matter: { is: matterScope } },
            select: { id: true, title: true, matter: { select: { matterCode: true } } },
          })
        : Promise.resolve([]),
    ]);
    const visibleDocuments = documents.filter((item) =>
      this.canViewDocument(item.isRestricted, item.isSensitive, item.permissions, auth),
    );
    const catalog: SearchResultItem[] = [
      ...clients.map((item) => ({
        id: item.id,
        type: 'CLIENT' as const,
        title: item.displayName,
        subtitle: item.clientCode,
        href: `/clients/${item.id}`,
        score: 0,
      })),
      ...matters.map((item) => ({
        id: item.id,
        type: 'MATTER' as const,
        title: item.name,
        subtitle: item.matterCode,
        href: `/matters/${item.id}`,
        score: 0,
      })),
      ...tasks.map((item) => ({
        id: item.id,
        type: 'TASK' as const,
        title: item.title,
        subtitle: item.matter.matterCode,
        href: `/tasks/${item.id}`,
        score: 0,
      })),
      ...visibleDocuments.map((item) => ({
        id: item.id,
        type: 'DOCUMENT' as const,
        title: item.title,
        subtitle: item.matter.matterCode,
        href: `/documents/${item.id}`,
        score: 0,
      })),
      ...deadlines.map((item) => ({
        id: item.id,
        type: 'DEADLINE' as const,
        title: item.title,
        subtitle: item.matter.matterCode,
        href: `/deadlines/${item.id}`,
        score: 0,
      })),
    ];
    const results = catalog
      .map((item) => ({
        ...item,
        score:
          normalized && `${item.title} ${item.subtitle ?? ''}`.toLowerCase().includes(normalized)
            ? 1
            : 0,
      }))
      .filter((item) => !normalized || item.score > 0)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'vi'));
    return { query, results, total: results.length };
  }

  async reportOverview(
    from?: string,
    to?: string,
    context?: PlatformUserContext,
  ): Promise<ReportOverview> {
    const auth = this.requireContext(context);
    const matterScope = this.matterScope(auth);
    const start = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
    const end = to ? new Date(to) : new Date();
    const createdAt = {
      gte: validDate(start) ? start : undefined,
      lte: validDate(end) ? end : undefined,
    };
    const [clients, matters, tasks, deadlines, documents, users] = await Promise.all([
      this.prisma.client.findMany({ where: { deletedAt: null, createdAt }, select: { id: true } }),
      this.prisma.matter.findMany({
        where: { deletedAt: null, createdAt, ...matterScope },
        select: { status: true },
      }),
      this.prisma.task.findMany({
        where: { deletedAt: null, createdAt, matter: { is: matterScope } },
        select: { status: true, assigneeId: true, dueDate: true },
      }),
      this.prisma.deadline.findMany({
        where: { createdAt, matter: { is: matterScope } },
        select: { id: true },
      }),
      this.prisma.document.findMany({
        where: { createdAt, matter: { is: matterScope } },
        select: {
          id: true,
          isRestricted: true,
          isSensitive: true,
          permissions: {
            select: { permission: true, userId: true, role: { select: { name: true } } },
          },
        },
      }),
      this.prisma.user.findMany({
        where: { deletedAt: null },
        select: { id: true, fullName: true },
      }),
    ]);
    const taskStatus = counts(tasks.map((item) => item.status));
    const matterStatus = counts(matters.map((item) => item.status));
    const openTasks = tasks.filter((task) => !['COMPLETED', 'CANCELLED'].includes(task.status));
    const workload = users
      .map((user) => {
        const assigned = openTasks.filter((task) => task.assigneeId === user.id);
        const overdue = assigned.filter((task) =>
          Boolean(task.dueDate && task.dueDate < new Date()),
        ).length;
        return {
          userId: user.id,
          userName: user.fullName,
          openTasks: assigned.length,
          overdueTasks: overdue,
        };
      })
      .filter((item) => item.openTasks > 0)
      .sort((a, b) => b.openTasks - a.openTasks);
    return {
      period: {
        from: (validDate(start) ? start : new Date(new Date().getFullYear(), 0, 1)).toISOString(),
        to: (validDate(end) ? end : new Date()).toISOString(),
      },
      totals: {
        clients: clients.length,
        matters: matters.length,
        tasks: tasks.length,
        deadlines: deadlines.length,
        documents: documents.filter((item) =>
          this.canViewDocument(item.isRestricted, item.isSensitive, item.permissions, auth),
        ).length,
      },
      taskStatus,
      matterStatus,
      workload,
    };
  }

  async listAudit(filters: {
    module?: string;
    action?: string;
    actorId?: string;
  }): Promise<AuditEntry[]> {
    const entries = await this.prisma.auditLog.findMany({
      where: {
        ...(filters.module ? { resourceType: filters.module } : {}),
        ...(filters.action ? { action: filters.action } : {}),
        ...(isUuid(filters.actorId) ? { userId: filters.actorId } : {}),
      },
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return entries.map((entry) => {
      const metadata = asRecord(entry.metadata);
      return {
        id: entry.id,
        action: entry.action,
        module: entry.resourceType,
        entityType: entry.resourceType,
        entityId: entry.resourceId ?? undefined,
        actorId: entry.userId ?? 'system',
        actorName: entry.user?.fullName ?? 'System',
        outcome: metadata.outcome === 'FAILURE' ? 'FAILURE' : 'SUCCESS',
        details: typeof metadata.details === 'string' ? metadata.details : undefined,
        ipAddress: entry.ipAddress ?? undefined,
        createdAt: entry.createdAt.toISOString(),
      };
    });
  }

  private toNotification(item: {
    id: string;
    title: string;
    message: string;
    type: string;
    readAt: Date | null;
    createdAt: Date;
    link: string | null;
    user: { fullName: string };
  }): NotificationItem {
    return {
      id: item.id,
      title: item.title,
      message: item.message,
      tone: notificationTone(item.type),
      readAt: item.readAt?.toISOString(),
      createdAt: item.createdAt.toISOString(),
      href: item.link ?? undefined,
      actorName: item.user.fullName,
    };
  }

  private requireContext(context?: PlatformUserContext): {
    userId: string;
    roles: string[];
  } {
    if (!isUuid(context?.userId)) throw new UnauthorizedException('Phiên đăng nhập không hợp lệ.');
    return { userId: context.userId, roles: context.roles ?? [] };
  }

  private matterScope(context: { userId: string; roles: string[] }): Prisma.MatterWhereInput {
    const memberScope: Prisma.MatterWhereInput = {
      OR: [
        { createdById: context.userId },
        { responsiblePartnerId: context.userId },
        { responsibleLawyerId: context.userId },
        { members: { some: { userId: context.userId } } },
      ],
    };
    const hasGlobalNonRestrictedAccess = context.roles.some((role) =>
      ['SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER'].includes(role),
    );
    return hasGlobalNonRestrictedAccess
      ? { OR: [{ confidentialityLevel: { not: 'RESTRICTED' } }, memberScope] }
      : memberScope;
  }

  private canViewDocument(
    isRestricted: boolean,
    isSensitive: boolean,
    permissions: Array<{
      permission: string;
      userId: string | null;
      role: { name: string } | null;
    }>,
    context: { userId: string; roles: string[] },
  ): boolean {
    if (!isRestricted && !isSensitive) return true;
    return permissions.some(
      (entry) =>
        entry.permission === 'VIEW' &&
        (entry.userId === context.userId ||
          (entry.role?.name !== undefined && context.roles.includes(entry.role.name))),
    );
  }
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function notificationTone(value: string): NotificationTone {
  return value === 'SUCCESS' || value === 'WARNING' || value === 'SECURITY' ? value : 'INFO';
}

function asRecord(value: Prisma.JsonValue | null): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function validDate(value: Date): boolean {
  return !Number.isNaN(value.getTime());
}

function counts(values: string[]): Array<{ status: string; count: number }> {
  const map = new Map<string, number>();
  for (const value of values) map.set(value, (map.get(value) ?? 0) + 1);
  return [...map.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => a.status.localeCompare(b.status));
}
