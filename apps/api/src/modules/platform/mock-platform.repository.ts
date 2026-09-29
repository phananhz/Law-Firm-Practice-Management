import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  AuditEntry,
  NotificationItem,
  ReportOverview,
  SearchResultItem,
  SearchResultSet,
} from '@lpms/types';
import type { PlatformRepository, PlatformUserContext } from './platform.repository';

@Injectable()
export class MockPlatformRepository implements PlatformRepository {
  private notifications: NotificationItem[] = [
    {
      id: 'noti-1',
      title: 'Nhiệm vụ mới được giao',
      message: 'Bạn được giao rà soát hồ sơ MAT-2026-0001.',
      tone: 'INFO',
      createdAt: new Date(Date.now() - 10 * 60_000).toISOString(),
      href: '/tasks/tsk-1',
      actorName: 'Trần Thị Bích',
    },
    {
      id: 'noti-2',
      title: 'Thời hạn sắp đến',
      message: 'Hạn phản hồi tài liệu của khách hàng còn 2 ngày.',
      tone: 'WARNING',
      createdAt: new Date(Date.now() - 60 * 60_000).toISOString(),
      href: '/deadlines/dl-2',
    },
    {
      id: 'noti-3',
      title: 'Tài liệu mới trong hồ sơ',
      message: 'Một bản dự thảo hợp đồng vừa được tải lên MAT-2026-0001.',
      tone: 'SUCCESS',
      readAt: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
      createdAt: new Date(Date.now() - 24 * 60 * 60_000).toISOString(),
      href: '/documents/doc-1',
      actorName: 'Lê Hoàng Nam',
    },
    {
      id: 'noti-4',
      title: 'Yêu cầu xem xét xung đột',
      message: 'Có một phiếu kiểm tra đang chờ quyết định.',
      tone: 'SECURITY',
      createdAt: new Date(Date.now() - 26 * 60 * 60_000).toISOString(),
      href: '/conflict-checks/cc-2',
    },
  ];

  private readonly auditEntries: AuditEntry[] = [
    {
      id: 'audit-1',
      action: 'MATTER_STATUS_CHANGED',
      module: 'matter',
      entityType: 'Matter',
      entityId: 'mat-1',
      actorId: 'emp-1',
      actorName: 'Nguyễn Văn Trường',
      outcome: 'SUCCESS',
      details: 'Chuyển hồ sơ sang trạng thái đang hoạt động.',
      ipAddress: '113.161.45.12',
      createdAt: new Date(Date.now() - 10 * 60_000).toISOString(),
    },
    {
      id: 'audit-2',
      action: 'TASK_CREATED',
      module: 'task',
      entityType: 'Task',
      entityId: 'tsk-1',
      actorId: 'emp-2',
      actorName: 'Trần Thị Bích',
      outcome: 'SUCCESS',
      details: 'Giao nhiệm vụ cho Lê Hoàng Nam.',
      ipAddress: '14.232.180.99',
      createdAt: new Date(Date.now() - 60 * 60_000).toISOString(),
    },
    {
      id: 'audit-3',
      action: 'DOCUMENT_UPLOADED',
      module: 'document',
      entityType: 'Document',
      entityId: 'doc-1',
      actorId: 'emp-3',
      actorName: 'Lê Hoàng Nam',
      outcome: 'SUCCESS',
      details: 'Tải lên phiên bản 2 của tài liệu.',
      ipAddress: '42.114.77.20',
      createdAt: new Date(Date.now() - 24 * 60 * 60_000).toISOString(),
    },
  ];

  listNotifications(unreadOnly = false, _context?: PlatformUserContext): NotificationItem[] {
    void _context;
    return this.notifications
      .filter((item) => !unreadOnly || !item.readAt)
      .map((item) => ({ ...item }));
  }

  markNotificationRead(id: string, _context?: PlatformUserContext): NotificationItem {
    void _context;
    const index = this.notifications.findIndex((item) => item.id === id);
    if (index < 0) throw new NotFoundException('Không tìm thấy thông báo.');
    this.notifications[index] = { ...this.notifications[index], readAt: new Date().toISOString() };
    return { ...this.notifications[index] };
  }

  markAllNotificationsRead(_context?: PlatformUserContext): { updated: number } {
    void _context;
    let updated = 0;
    const readAt = new Date().toISOString();
    this.notifications = this.notifications.map((item) => {
      if (item.readAt) return item;
      updated += 1;
      return { ...item, readAt };
    });
    return { updated };
  }

  search(
    query: string,
    type?: SearchResultItem['type'],
    _context?: PlatformUserContext,
  ): SearchResultSet {
    void _context;
    const normalized = query.trim().toLowerCase();
    const catalog: SearchResultItem[] = [
      {
        id: 'cli-1',
        type: 'CLIENT',
        title: 'Công ty Cổ phần Năng lượng Tái tạo Mekong',
        subtitle: 'CLI-2026-000001',
        href: '/clients/cli-1',
        score: 0,
      },
      {
        id: 'mat-1',
        type: 'MATTER',
        title: 'Tư vấn dự án Solar Việt Nam',
        subtitle: 'MAT-2026-0001',
        href: '/matters/mat-1',
        score: 0,
      },
      {
        id: 'tsk-1',
        type: 'TASK',
        title: 'Rà soát điều khoản bảo lãnh',
        subtitle: 'TSK-2026-0001',
        href: '/tasks/tsk-1',
        score: 0,
      },
      {
        id: 'dl-1',
        type: 'DEADLINE',
        title: 'Nộp bản giải trình cho Tòa án',
        subtitle: 'DL-2026-0001',
        href: '/deadlines/dl-1',
        score: 0,
      },
      {
        id: 'doc-1',
        type: 'DOCUMENT',
        title: 'Dự thảo hợp đồng tư vấn pháp lý',
        subtitle: 'hop-dong-tu-van-v2.docx',
        href: '/documents/doc-1',
        score: 0,
      },
    ];
    const results = catalog
      .filter((item) => !type || item.type === type)
      .map((item) => {
        const haystack = `${item.title} ${item.subtitle ?? ''}`.toLowerCase();
        const score = normalized && haystack.includes(normalized) ? 1 : 0;
        return { ...item, score };
      })
      .filter((item) => !normalized || item.score > 0)
      .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'vi'));
    return { query, results, total: results.length };
  }

  reportOverview(from?: string, to?: string, _context?: PlatformUserContext): ReportOverview {
    void _context;
    return {
      period: {
        from: from ?? new Date(new Date().getFullYear(), 0, 1).toISOString(),
        to: to ?? new Date().toISOString(),
      },
      totals: { clients: 24, matters: 18, tasks: 47, deadlines: 12, documents: 136 },
      taskStatus: [
        { status: 'TODO', count: 14 },
        { status: 'IN_PROGRESS', count: 18 },
        { status: 'COMPLETED', count: 12 },
        { status: 'BLOCKED', count: 3 },
      ],
      matterStatus: [
        { status: 'INTAKE', count: 3 },
        { status: 'ACTIVE', count: 11 },
        { status: 'ON_HOLD', count: 2 },
        { status: 'CLOSED', count: 2 },
      ],
      workload: [
        { userId: 'emp-3', userName: 'Lê Hoàng Nam', openTasks: 9, overdueTasks: 1 },
        { userId: 'emp-4', userName: 'Nguyễn Văn An', openTasks: 7, overdueTasks: 2 },
        { userId: 'emp-2', userName: 'Trần Thị Bích', openTasks: 5, overdueTasks: 0 },
      ],
    };
  }

  listAudit(filters: { module?: string; action?: string; actorId?: string }): AuditEntry[] {
    return this.auditEntries
      .filter((entry) => !filters.module || entry.module === filters.module)
      .filter((entry) => !filters.action || entry.action === filters.action)
      .filter((entry) => !filters.actorId || entry.actorId === filters.actorId)
      .map((entry) => ({ ...entry }));
  }

  appendAudit(input: Omit<AuditEntry, 'id' | 'createdAt'>): AuditEntry {
    const entry = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
    this.auditEntries.unshift(entry);
    return { ...entry };
  }
}
