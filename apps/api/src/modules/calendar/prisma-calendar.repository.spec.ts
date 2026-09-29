import type { PrismaService } from '../../database/prisma.service';
import { PrismaCalendarRepository } from './prisma-calendar.repository';

const userId = '00000000-0000-4000-8000-000000000001';
const context = { userId, roles: ['LAWYER'] };

describe('PrismaCalendarRepository authorization boundary', () => {
  it('requires an authenticated UUID context for calendar reads', async () => {
    const repository = new PrismaCalendarRepository({} as never);

    await expect(repository.find(userId)).rejects.toThrow('Phiên đăng nhập không hợp lệ');
  });

  it('scopes calendar list queries to public events or accessible matters', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const repository = new PrismaCalendarRepository({
      calendarEvent: { findMany },
    } as unknown as PrismaService);

    await expect(repository.list(undefined, undefined, undefined, context)).resolves.toEqual([]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { matterId: null },
            { matter: { is: expect.objectContaining({ OR: expect.any(Array) }) } },
          ],
        }),
      }),
    );
  });

  it('rejects creating an event for a matter outside the user scope', async () => {
    const userFindFirst = jest.fn().mockResolvedValue({ id: userId });
    const matterFindFirst = jest.fn().mockResolvedValue(null);
    const repository = new PrismaCalendarRepository({
      user: { findFirst: userFindFirst },
      matter: { findFirst: matterFindFirst },
      calendarEvent: { create: jest.fn() },
    } as unknown as PrismaService);

    await expect(
      repository.create(
        {
          matterId: userId,
          title: 'Restricted hearing',
          eventType: 'HEARING',
          startTime: '2026-09-29T09:00:00.000Z',
          endTime: '2026-09-29T10:00:00.000Z',
        },
        context,
      ),
    ).rejects.toThrow('Không tìm thấy vụ việc');
  });
});
