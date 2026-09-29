import type { PrismaService } from '../../database/prisma.service';
import type { CalendarRepository } from './calendar.repository';

export function selectCalendarRepository(
  prisma: Pick<PrismaService, 'isEnabled'>,
  mock: CalendarRepository,
  persisted: CalendarRepository,
): CalendarRepository {
  return prisma.isEnabled ? persisted : mock;
}
