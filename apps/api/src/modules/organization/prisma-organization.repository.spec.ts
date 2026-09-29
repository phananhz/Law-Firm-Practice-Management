import { PrismaOrganizationRepository } from './prisma-organization.repository';
import type { PrismaService } from '../../database/prisma.service';

const employee = {
  id: 'user-1',
  email: 'lawyer@lpms.vn',
  passwordHash: 'hash',
  fullName: 'Nguyễn Văn An',
  phone: '0909000000',
  employeeCode: 'EMP-001',
  startDate: new Date('2026-01-01T00:00:00.000Z'),
  departmentId: 'dep-1',
  positionId: 'pos-1',
  managerId: null,
  status: 'ACTIVE',
  mfaEnabled: false,
  mfaSecretEncrypted: null,
  recoveryCodeHashes: null,
  failedLoginAttempts: 0,
  lockedUntil: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
  department: {
    id: 'dep-1',
    branchId: null,
    managerId: null,
    code: 'LIT',
    name: 'Litigation',
    description: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  position: {
    id: 'pos-1',
    code: 'LAW',
    title: 'Luật sư',
    level: 4,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  },
  roles: [
    {
      userId: 'user-1',
      roleId: 'role-1',
      role: { id: 'role-1', name: 'LAWYER' },
    },
  ],
  refreshSessions: [{ id: 'session-1' }],
};

describe('PrismaOrganizationRepository', () => {
  it('maps persisted users to employee response records', async () => {
    const prisma = {
      user: { findMany: jest.fn().mockResolvedValue([employee]) },
    } as unknown as PrismaService;
    const repository = new PrismaOrganizationRepository(prisma);

    await expect(repository.listEmployees()).resolves.toEqual([
      expect.objectContaining({
        id: 'user-1',
        employeeCode: 'EMP-001',
        departmentName: 'Litigation',
        positionTitle: 'Luật sư',
        roles: ['LAWYER'],
        activeSessionsCount: 1,
      }),
    ]);
  });

  it('rejects employee creation when department or position is missing', async () => {
    const prisma = {
      department: { findUnique: jest.fn().mockResolvedValue(null) },
      position: { findUnique: jest.fn() },
      role: { findMany: jest.fn() },
    } as unknown as PrismaService;
    const repository = new PrismaOrganizationRepository(prisma);

    await expect(
      repository.createEmployee({
        employeeCode: 'EMP-002',
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '0909000001',
        departmentId: 'missing-department',
        positionId: 'missing-position',
        roles: ['LAWYER'],
        startDate: '2026-01-01',
      }),
    ).rejects.toThrow('Phòng ban hoặc chức danh không tồn tại');
  });
});
