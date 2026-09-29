import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  CalendarContext,
  CalendarEventInput,
  CalendarEventRecord,
  CalendarRepository,
} from './calendar.repository';

function iso(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 3_600_000).toISOString();
}

@Injectable()
export class MockCalendarRepository implements CalendarRepository {
  private readonly events: CalendarEventRecord[] = [
    {
      id: 'event-1',
      matterId: 'mat-1',
      matterCode: 'MAT-2026-0001',
      title: 'Họp giao ban nghiệp vụ',
      eventType: 'MEETING',
      startTime: iso(2),
      endTime: iso(3),
      location: 'Phòng họp A',
      organizerId: 'emp-1',
      organizerName: 'Nguyễn Văn Trường',
      createdAt: iso(-24),
      updatedAt: iso(-24),
    },
    {
      id: 'event-2',
      matterId: 'mat-2',
      matterCode: 'MAT-2026-0002',
      title: 'Trao đổi hồ sơ với khách hàng',
      eventType: 'APPOINTMENT',
      startTime: iso(5),
      endTime: iso(6),
      location: 'Online',
      organizerId: 'emp-2',
      organizerName: 'Trần Thị Bích',
      createdAt: iso(-12),
      updatedAt: iso(-12),
    },
  ];

  list(
    from?: string,
    to?: string,
    matterId?: string,
    _context?: CalendarContext,
  ): CalendarEventRecord[] {
    void _context;
    const fromDate = from ? new Date(from).getTime() : Number.NEGATIVE_INFINITY;
    const toDate = to ? new Date(to).getTime() : Number.POSITIVE_INFINITY;
    return this.events
      .filter((event) => !matterId || event.matterId === matterId)
      .filter((event) => {
        const start = new Date(event.startTime).getTime();
        return start >= fromDate && start <= toDate;
      })
      .map((event) => ({ ...event }));
  }

  find(id: string, _context?: CalendarContext): CalendarEventRecord {
    void _context;
    const event = this.events.find((item) => item.id === id);
    if (!event) throw new NotFoundException('Không tìm thấy sự kiện.');
    return { ...event };
  }

  create(input: CalendarEventInput, _context?: CalendarContext): CalendarEventRecord {
    void _context;
    ensureChronology(input.startTime, input.endTime);
    const now = new Date().toISOString();
    const event: CalendarEventRecord = {
      id: randomUUID(),
      ...input,
      organizerId: input.organizerId ?? 'emp-1',
      createdAt: now,
      updatedAt: now,
    };
    this.events.unshift(event);
    return { ...event };
  }

  update(
    id: string,
    input: Partial<CalendarEventInput>,
    _context?: CalendarContext,
  ): CalendarEventRecord {
    void _context;
    const index = this.events.findIndex((event) => event.id === id);
    if (index < 0) throw new NotFoundException('Không tìm thấy sự kiện.');
    const next = {
      ...this.events[index],
      ...input,
      id,
      updatedAt: new Date().toISOString(),
    };
    ensureChronology(next.startTime, next.endTime);
    this.events[index] = next;
    return { ...this.events[index] };
  }

  remove(id: string, _context?: CalendarContext): { id: string } {
    void _context;
    const index = this.events.findIndex((event) => event.id === id);
    if (index < 0) throw new NotFoundException('Không tìm thấy sự kiện.');
    this.events.splice(index, 1);
    return { id };
  }
}

function ensureChronology(start: string, end: string): void {
  if (new Date(end).getTime() <= new Date(start).getTime())
    throw new Error('endTime phải sau startTime.');
}
