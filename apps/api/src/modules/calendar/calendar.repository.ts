export type CalendarEventRecord = {
  id: string;
  matterId?: string;
  matterCode?: string;
  title: string;
  eventType: string;
  startTime: string;
  endTime: string;
  location?: string;
  organizerId: string;
  organizerName?: string;
  createdAt: string;
  updatedAt: string;
};

export type CalendarEventInput = {
  matterId?: string;
  title: string;
  eventType: string;
  startTime: string;
  endTime: string;
  location?: string;
  organizerId?: string;
};

export type CalendarContext = {
  userId: string;
  roles: string[];
};

export interface CalendarRepository {
  list(
    from?: string,
    to?: string,
    matterId?: string,
    context?: CalendarContext,
  ): CalendarEventRecord[] | Promise<CalendarEventRecord[]>;
  find(id: string, context?: CalendarContext): CalendarEventRecord | Promise<CalendarEventRecord>;
  create(
    input: CalendarEventInput,
    context?: CalendarContext,
  ): CalendarEventRecord | Promise<CalendarEventRecord>;
  update(
    id: string,
    input: Partial<CalendarEventInput>,
    context?: CalendarContext,
  ): CalendarEventRecord | Promise<CalendarEventRecord>;
  remove(id: string, context?: CalendarContext): { id: string } | Promise<{ id: string }>;
}

export const CALENDAR_REPOSITORY = Symbol('CALENDAR_REPOSITORY');
