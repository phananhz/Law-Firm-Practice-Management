import { PrismaClientsRepository } from './prisma-clients.repository';
import type { PrismaService } from '../../database/prisma.service';

function persistedClient() {
  const createdAt = new Date('2026-01-10T00:00:00.000Z');
  return {
    id: 'client-1',
    clientCode: 'CLI-2026-000001',
    type: 'ORGANIZATION',
    status: 'ACTIVE',
    displayName: 'Solar Việt Nam',
    email: 'contact@solar.vn',
    phone: '02838221234',
    address: 'Quận 1, TP. Hồ Chí Minh',
    nationality: null,
    idNumber: null,
    occupation: null,
    taxCode: '0312345678',
    enterpriseNumber: '0312345678',
    legalRepresentative: 'Nguyễn Minh Khang',
    website: 'https://solar.vn',
    industry: 'Năng lượng',
    notes: null,
    createdAt,
    contacts: [
      {
        isPrimary: true,
        contact: {
          id: 'contact-1',
          fullName: 'Nguyễn Minh Khang',
          email: 'khang@solar.vn',
          phone: '0909000001',
          position: 'Tổng giám đốc',
          idNumber: null,
          notes: null,
          createdAt,
        },
      },
    ],
    relationsFrom: [
      {
        id: 'relation-1',
        sourceClientId: 'client-1',
        targetClientId: null,
        targetName: 'Solar Holdings',
        relationType: 'PARENT',
        notes: null,
        createdAt,
        targetClient: null,
      },
    ],
    matters: [{ id: 'matter-1' }],
  };
}

describe('PrismaClientsRepository', () => {
  it('maps Prisma relations to the stable API client contract', async () => {
    const prisma = {
      client: { findMany: jest.fn().mockResolvedValue([persistedClient()]) },
    } as unknown as PrismaService;
    const repository = new PrismaClientsRepository(prisma);

    await expect(repository.list()).resolves.toEqual([
      expect.objectContaining({
        id: 'client-1',
        clientCode: 'CLI-2026-000001',
        mattersCount: 1,
        contactsCount: 1,
        contacts: [expect.objectContaining({ id: 'contact-1', isPrimary: true })],
        relations: [expect.objectContaining({ targetName: 'Solar Holdings' })],
      }),
    ]);
  });

  it('rejects an unknown client instead of leaking an empty record', async () => {
    const prisma = {
      client: { findFirst: jest.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;
    const repository = new PrismaClientsRepository(prisma);

    await expect(repository.find('missing')).rejects.toThrow('Không tìm thấy khách hàng');
  });
});
