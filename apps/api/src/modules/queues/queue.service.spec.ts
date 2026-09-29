import { QueueService } from './queue.service';

describe('QueueService', () => {
  const event = {
    messageId: 'message-1',
    topic: 'lpms-events',
    eventType: 'AUDIT_EVENT' as const,
    payload: { action: 'TEST' },
  };

  it('deduplicates deliveries in mock mode', async () => {
    const service = new QueueService(
      { isEnabled: false } as never,
      { get: () => 'secret' } as never,
    );
    await expect(service.process(event)).resolves.toEqual({
      status: 'processed',
      messageId: 'message-1',
    });
    await expect(service.process(event)).resolves.toEqual({
      status: 'duplicate',
      messageId: 'message-1',
    });
  });

  it('rejects unsupported event types before touching persistence', async () => {
    const service = new QueueService(
      { isEnabled: false } as never,
      { get: () => 'secret' } as never,
    );
    await expect(service.process({ ...event, eventType: 'UNKNOWN' as never })).rejects.toThrow();
  });

  it('builds deterministic deadline reminder events for the requested date', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'deadline-1',
        title: 'Nộp hồ sơ',
        dueDate: new Date('2026-10-06T00:00:00.000Z'),
        reminderDays: [3, 7, 7],
        responsiblePersonId: 'user-1',
        matter: { matterCode: 'MAT-2026-000001', name: 'Hồ sơ doanh nghiệp' },
      },
      {
        id: 'deadline-2',
        title: 'Không nhắc hôm nay',
        dueDate: new Date('2026-10-10T00:00:00.000Z'),
        reminderDays: [3],
        responsiblePersonId: 'user-2',
        matter: { matterCode: 'MAT-2026-000002', name: 'Hồ sơ khác' },
      },
    ]);
    const service = new QueueService(
      { isEnabled: true, deadline: { findMany } } as never,
      { get: () => 'secret' } as never,
    );

    await expect(service.reminderEvents('2026-09-29')).resolves.toEqual([
      {
        messageId: 'deadline-reminder:deadline-1:2026-10-06:7',
        topic: 'lpms-events',
        eventType: 'NOTIFICATION_CREATE',
        payload: {
          userId: 'user-1',
          title: 'Sắp đến hạn: Nộp hồ sơ',
          message: 'Nộp hồ sơ đến hạn trong 7 ngày (MAT-2026-000001 · Hồ sơ doanh nghiệp).',
          type: 'DEADLINE_REMINDER',
          link: '/deadlines/deadline-1',
        },
      },
    ]);
    expect(findMany).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid reminder dates and validates the internal secret', async () => {
    const service = new QueueService(
      { isEnabled: false } as never,
      { get: () => 'queue-secret' } as never,
    );

    await expect(service.reminderEvents('2026-02-30')).rejects.toThrow();
    expect(service.isInternalSecret('queue-secret')).toBe(true);
    expect(service.isInternalSecret('wrong-secret')).toBe(false);
    expect(service.isInternalSecret('é')).toBe(false);
  });
});
