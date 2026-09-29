import type { PrismaService } from '../../database/prisma.service';
import { PrismaPlatformRepository } from './prisma-platform.repository';

const userId = '00000000-0000-4000-8000-000000000001';
const context = { userId, roles: ['LAWYER'] };

describe('PrismaPlatformRepository authorization boundary', () => {
  it('does not run global search without an authenticated context', async () => {
    const repository = new PrismaPlatformRepository({} as never);

    await expect(repository.search('anything')).rejects.toThrow('Phiên đăng nhập không hợp lệ');
  });

  it('applies Matter scope to global search queries', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const repository = new PrismaPlatformRepository({
      client: { findMany },
      matter: { findMany },
      task: { findMany },
      document: { findMany },
      deadline: { findMany },
    } as unknown as PrismaService);

    await expect(repository.search('matter', undefined, context)).resolves.toEqual({
      query: 'matter',
      results: [],
      total: 0,
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          OR: expect.arrayContaining([{ members: { some: { userId } } }]),
        }),
      }),
    );
  });

  it('filters restricted documents from search without a matching VIEW permission', async () => {
    const empty = jest.fn().mockResolvedValue([]);
    const repository = new PrismaPlatformRepository({
      client: { findMany: empty },
      matter: { findMany: empty },
      task: { findMany: empty },
      deadline: { findMany: empty },
      document: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: '00000000-0000-4000-8000-000000000099',
            title: 'Restricted document',
            isRestricted: true,
            isSensitive: false,
            permissions: [{ permission: 'VIEW', userId: null, role: { name: 'PARTNER' } }],
            matter: { matterCode: 'MAT-2026-0001' },
          },
        ]),
      },
    } as unknown as PrismaService);

    await expect(repository.search('restricted', 'DOCUMENT', context)).resolves.toMatchObject({
      results: [],
      total: 0,
    });
  });
});
