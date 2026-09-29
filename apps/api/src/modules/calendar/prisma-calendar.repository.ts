import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CalendarEventType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type {
  CalendarContext,
  CalendarEventInput,
  CalendarEventRecord,
  CalendarRepository,
} from './calendar.repository';

const eventInclude = {
  matter: { select: { id: true, matterCode: true } },
  organizer: { select: { id: true, fullName: true } },
} as const;

type PersistedEvent = Prisma.CalendarEventGetPayload<{ include: typeof eventInclude }>;

@Injectable()
export class PrismaCalendarRepository implements CalendarRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    from?: string,
    to?: string,
    matterId?: string,
    context?: CalendarContext,
  ): Promise<CalendarEventRecord[]> {
    const auth = this.requireContext(context);
    const start = dateTime(from);
    const end = dateTime(to);
    const events = await this.prisma.calendarEvent.findMany({
      where: {
        OR: [{ matterId: null }, { matter: { is: this.matterScope(auth) } }],
        ...(matterId && isUuid(matterId) ? { matterId } : {}),
        ...(start || end ? { startTime: { gte: start, lte: end } } : {}),
      },
      include: eventInclude,
      orderBy: { startTime: 'asc' },
    });
    return events.map((event) => this.toRecord(event));
  }

  async find(id: string, context?: CalendarContext): Promise<CalendarEventRecord> {
    if (!isUuid(id)) throw new NotFoundException('Không tìm thấy sự kiện.');
    const auth = this.requireContext(context);
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id },
      include: eventInclude,
    });
    if (!event) throw new NotFoundException('Không tìm thấy sự kiện.');
    if (event.matterId) await this.ensureMatter(event.matterId, auth);
    return this.toRecord(event);
  }

  async create(input: CalendarEventInput, context?: CalendarContext): Promise<CalendarEventRecord> {
    const auth = this.requireContext(context);
    const organizerId = await this.requiredUser(auth.userId);
    const startTime = requiredDate(input.startTime, 'startTime');
    const endTime = requiredDate(input.endTime, 'endTime');
    if (endTime <= startTime) throw new BadRequestException('endTime phải sau startTime.');
    const event = await this.prisma.calendarEvent.create({
      data: {
        matterId: await this.optionalMatter(input.matterId, auth),
        title: input.title.trim(),
        eventType: enumValue(input.eventType, CalendarEventType) ?? CalendarEventType.MEETING,
        startTime,
        endTime,
        location: input.location?.trim() || undefined,
        organizerId,
      },
      include: eventInclude,
    });
    return this.toRecord(event);
  }

  async update(
    id: string,
    input: Partial<CalendarEventInput>,
    context?: CalendarContext,
  ): Promise<CalendarEventRecord> {
    if (!isUuid(id)) throw new NotFoundException('Không tìm thấy sự kiện.');
    const auth = this.requireContext(context);
    const existing = await this.find(id, auth);
    const startTime = input.startTime ? requiredDate(input.startTime, 'startTime') : undefined;
    const endTime = input.endTime ? requiredDate(input.endTime, 'endTime') : undefined;
    const resolvedStart = startTime ?? new Date(existing.startTime);
    const resolvedEnd = endTime ?? new Date(existing.endTime);
    if (resolvedEnd <= resolvedStart) throw new BadRequestException('endTime phải sau startTime.');
    const event = await this.prisma.calendarEvent.update({
      where: { id },
      data: {
        matterId:
          input.matterId === undefined
            ? undefined
            : await this.optionalMatter(input.matterId, auth),
        title: input.title?.trim(),
        eventType: enumValue(input.eventType, CalendarEventType),
        startTime,
        endTime,
        location: input.location?.trim(),
        organizerId: input.organizerId ? await this.requiredUser(auth.userId) : undefined,
      },
      include: eventInclude,
    });
    return this.toRecord(event);
  }

  async remove(id: string, context?: CalendarContext): Promise<{ id: string }> {
    if (!isUuid(id)) throw new NotFoundException('Không tìm thấy sự kiện.');
    await this.find(id, context);
    await this.prisma.calendarEvent.delete({ where: { id } });
    return { id };
  }

  private async requiredUser(value?: string): Promise<string> {
    if (value && isUuid(value)) {
      const user = await this.prisma.user.findFirst({
        where: { id: value, deletedAt: null },
        select: { id: true },
      });
      if (user) return user.id;
    }
    const first = await this.prisma.user.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!first) throw new BadRequestException('Chưa có người dùng để gắn sự kiện.');
    return first.id;
  }

  private async optionalMatter(
    value?: string,
    context?: CalendarContext,
  ): Promise<string | undefined> {
    if (!value) return undefined;
    if (!isUuid(value)) throw new BadRequestException('matterId không hợp lệ.');
    const auth = this.requireContext(context);
    const matter = await this.prisma.matter.findFirst({
      where: { id: value, deletedAt: null, ...this.matterScope(auth) },
      select: { id: true },
    });
    if (!matter) throw new NotFoundException('Không tìm thấy vụ việc.');
    return matter.id;
  }

  private toRecord(event: PersistedEvent): CalendarEventRecord {
    return {
      id: event.id,
      matterId: event.matterId ?? undefined,
      matterCode: event.matter?.matterCode,
      title: event.title,
      eventType: event.eventType,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      location: event.location ?? undefined,
      organizerId: event.organizerId,
      organizerName: event.organizer.fullName,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }

  private requireContext(context?: CalendarContext): CalendarContext {
    if (!context?.userId || !isUuid(context.userId))
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ.');
    return context;
  }

  private async ensureMatter(id: string, context: CalendarContext): Promise<void> {
    const matter = await this.prisma.matter.findFirst({
      where: { id, deletedAt: null, ...this.matterScope(context) },
      select: { id: true },
    });
    if (!matter) throw new NotFoundException('Không tìm thấy vụ việc.');
  }

  private matterScope(context: CalendarContext): Prisma.MatterWhereInput {
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
      ? {
          OR: [{ confidentialityLevel: { not: 'RESTRICTED' } }, memberScope],
        }
      : memberScope;
  }
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function dateTime(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function requiredDate(value: string, field: string): Date {
  const parsed = dateTime(value);
  if (!parsed) throw new BadRequestException(`${field} không hợp lệ.`);
  return parsed;
}

function enumValue<T extends string>(value: unknown, values: Record<string, T>): T | undefined {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(values, value)
    ? values[value]
    : undefined;
}
