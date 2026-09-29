import { MockCalendarRepository } from './mock-calendar.repository';
import { selectCalendarRepository } from './calendar.repository-selection';
import type { CalendarRepository } from './calendar.repository';

describe('selectCalendarRepository', () => {
  it('selects mock or Prisma by persistence mode', () => {
    const mock = new MockCalendarRepository();
    const persisted = {} as CalendarRepository;
    expect(selectCalendarRepository({ isEnabled: false }, mock, persisted)).toBe(mock);
    expect(selectCalendarRepository({ isEnabled: true }, mock, persisted)).toBe(persisted);
  });
});
