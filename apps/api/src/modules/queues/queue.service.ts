import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import type { QueueEvent, QueueProcessResult, QueueReminderEvent } from './queue.types';

const REMINDER_WINDOW_DAYS = 366;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class QueueService {
  private readonly mockProcessed = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async process(event: QueueEvent): Promise<QueueProcessResult> {
    validateEvent(event);
    if (!this.prisma.isEnabled) {
      if (this.mockProcessed.has(event.messageId))
        return { status: 'duplicate', messageId: event.messageId };
      this.mockProcessed.add(event.messageId);
      return { status: 'processed', messageId: event.messageId };
    }

    try {
      await this.prisma.$transaction(async (transaction) => {
        await transaction.queueDelivery.create({
          data: {
            id: randomUUID(),
            messageId: event.messageId,
            topic: event.topic,
            eventType: event.eventType,
            payload: event.payload as Prisma.InputJsonValue,
          },
        });
        if (event.eventType === 'NOTIFICATION_CREATE')
          await this.createNotification(transaction, event.payload);
        if (event.eventType === 'AUDIT_EVENT') await this.createAudit(transaction, event.payload);
        await transaction.queueDelivery.update({
          where: { messageId: event.messageId },
          data: { status: 'SUCCEEDED', processedAt: new Date() },
        });
      });
      return { status: 'processed', messageId: event.messageId };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        return { status: 'duplicate', messageId: event.messageId };
      throw error;
    }
  }

  internalSecret(): string | undefined {
    return this.config.get<string>('QUEUE_INTERNAL_SECRET');
  }

  isInternalSecret(secret: string | undefined): boolean {
    const expected = this.internalSecret();
    if (!expected || !secret) return false;
    const expectedBytes = Buffer.from(expected);
    const secretBytes = Buffer.from(secret);
    return Boolean(
      expectedBytes.length === secretBytes.length && timingSafeEqual(secretBytes, expectedBytes),
    );
  }

  async reminderEvents(date?: string): Promise<QueueReminderEvent[]> {
    const targetDate = parseDateOnly(date ?? dateOnly(new Date()));
    if (!this.prisma.isEnabled) return [];

    const deadlines = await this.prisma.deadline.findMany({
      where: {
        isCompleted: false,
        responsiblePersonId: { not: null },
        dueDate: {
          gte: targetDate,
          lte: addDays(targetDate, REMINDER_WINDOW_DAYS),
        },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        reminderDays: true,
        responsiblePersonId: true,
        matter: { select: { matterCode: true, name: true } },
      },
    });

    return deadlines.flatMap((deadline) => {
      if (!deadline.responsiblePersonId) return [];
      const dueDate = dateOnly(deadline.dueDate);
      const daysUntilDue = differenceInDays(targetDate, deadline.dueDate);
      const reminderDays = [...new Set(deadline.reminderDays)]
        .filter((days) => Number.isInteger(days) && days >= 0 && days <= REMINDER_WINDOW_DAYS)
        .sort((left, right) => right - left);
      if (!reminderDays.includes(daysUntilDue)) return [];

      const daysLabel = daysUntilDue === 0 ? 'hôm nay' : `trong ${daysUntilDue} ngày`;
      const matterLabel = deadline.matter.matterCode
        ? `${deadline.matter.matterCode} · ${deadline.matter.name}`
        : deadline.matter.name;
      const messageId = `deadline-reminder:${deadline.id}:${dueDate}:${daysUntilDue}`;
      return [
        {
          messageId,
          topic: 'lpms-events',
          eventType: 'NOTIFICATION_CREATE' as const,
          payload: {
            userId: deadline.responsiblePersonId,
            title: `Sắp đến hạn: ${deadline.title}`,
            message: `${deadline.title} đến hạn ${daysLabel} (${matterLabel}).`,
            type: 'DEADLINE_REMINDER',
            link: `/deadlines/${deadline.id}`,
          },
        },
      ];
    });
  }

  private async createNotification(
    transaction: Prisma.TransactionClient,
    payload: Record<string, unknown>,
  ) {
    const userId = uuid(payload.userId);
    if (!userId) throw new BadRequestException('Notification queue payload thiếu userId hợp lệ.');
    await transaction.notification.create({
      data: {
        userId,
        title: stringValue(payload.title) ?? 'Thông báo mới',
        message: stringValue(payload.message) ?? '',
        type: stringValue(payload.type) ?? 'INFO',
        link: stringValue(payload.link),
      },
    });
  }

  private async createAudit(
    transaction: Prisma.TransactionClient,
    payload: Record<string, unknown>,
  ) {
    await transaction.auditLog.create({
      data: {
        userId: uuid(payload.userId),
        action: stringValue(payload.action) ?? 'QUEUE_EVENT',
        resourceType: stringValue(payload.resourceType) ?? 'queue',
        resourceId: stringValue(payload.resourceId),
        ipAddress: stringValue(payload.ipAddress),
        userAgent: stringValue(payload.userAgent),
        requestId: stringValue(payload.requestId),
        metadata: payload.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }
}

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function parseDateOnly(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException('date phải có định dạng YYYY-MM-DD.');
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || dateOnly(parsed) !== value) {
    throw new BadRequestException('date không hợp lệ.');
  }
  return parsed;
}

function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * DAY_MS);
}

function differenceInDays(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

function validateEvent(event: QueueEvent): void {
  if (!event || typeof event !== 'object' || !event.messageId || !event.topic || !event.eventType) {
    throw new BadRequestException('Queue event không hợp lệ.');
  }
  if (!['NOTIFICATION_CREATE', 'AUDIT_EVENT'].includes(event.eventType)) {
    throw new BadRequestException('Queue event type không được hỗ trợ.');
  }
  if (!event.payload || typeof event.payload !== 'object' || Array.isArray(event.payload)) {
    throw new BadRequestException('Queue payload phải là object.');
  }
}

function uuid(value: unknown): string | undefined {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
