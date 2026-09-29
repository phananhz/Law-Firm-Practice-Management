import type { PrismaService } from '../../database/prisma.service';
import { PrismaOperationsRepository } from './prisma-operations.repository';

const userId = '00000000-0000-4000-8000-000000000001';
const context = { userId, roles: ['LAWYER'] };

describe('PrismaOperationsRepository authorization boundary', () => {
  it('rejects resource reads without an authenticated UUID context', async () => {
    const repository = new PrismaOperationsRepository({} as never);

    await expect(repository.find('matter', userId)).rejects.toThrow('Phiên đăng nhập không hợp lệ');
  });

  it('scopes matter listing to membership/responsibility for non-global roles', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const repository = new PrismaOperationsRepository({
      matter: { findMany },
    } as unknown as PrismaService);

    await expect(repository.list('matter', context)).resolves.toEqual([]);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
          OR: expect.arrayContaining([
            { createdById: userId },
            { responsiblePartnerId: userId },
            { responsibleLawyerId: userId },
            { members: { some: { userId } } },
          ]),
        }),
      }),
    );
  });

  it('requires explicit VIEW permission for a restricted document', async () => {
    const findFirst = jest.fn().mockResolvedValue({
      isRestricted: true,
      isSensitive: false,
      downloadRestricted: false,
      permissions: [{ permission: 'VIEW', userId: null, role: { name: 'PARTNER' } }],
    });
    const repository = new PrismaOperationsRepository({
      document: { findFirst },
    } as unknown as PrismaService);

    await expect(repository.assertDocumentPermission(userId, 'VIEW', context)).rejects.toThrow(
      'Bạn không có quyền với tài liệu này',
    );
  });

  it('allows a user-specific document permission and scopes the matter relation', async () => {
    const findFirst = jest.fn().mockResolvedValue({
      isRestricted: true,
      isSensitive: false,
      downloadRestricted: true,
      permissions: [{ permission: 'DOWNLOAD', userId, role: null }],
    });
    const repository = new PrismaOperationsRepository({
      document: { findFirst },
    } as unknown as PrismaService);

    await expect(
      repository.assertDocumentPermission(userId, 'DOWNLOAD', context),
    ).resolves.toBeUndefined();
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: userId,
          matter: { is: expect.objectContaining({ OR: expect.any(Array) }) },
        }),
      }),
    );
  });
});
