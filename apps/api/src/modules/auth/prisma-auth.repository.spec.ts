import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../../database/prisma.service';
import { PrismaAuthRepository } from './prisma-auth.repository';

const persistedUser = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'lawyer@lpms.vn',
  passwordHash: 'hash',
  fullName: 'Nguyá»…n VÄƒn An',
  status: 'ACTIVE' as const,
  mfaEnabled: false,
  mfaSecretEncrypted: null,
  recoveryCodeHashes: ['HASHED-CODE'],
  failedLoginAttempts: 0,
  lockedUntil: null,
  roles: [{ role: { name: 'LAWYER' } }],
};

describe('PrismaAuthRepository', () => {
  const config = {
    getOrThrow: jest.fn().mockReturnValue('test-auth-encryption-key-that-is-long-enough'),
  } as unknown as ConfigService;

  it('maps the persisted user and role names to the auth contract', async () => {
    const prisma = {
      user: { findFirst: jest.fn().mockResolvedValue(persistedUser) },
    } as unknown as PrismaService;
    const repository = new PrismaAuthRepository(prisma, config);

    await expect(repository.findUserByEmail('LAWYER@LPMS.VN')).resolves.toEqual(
      expect.objectContaining({
        id: persistedUser.id,
        email: persistedUser.email,
        roles: ['LAWYER'],
        recoveryCodeHashes: ['HASHED-CODE'],
      }),
    );
  });

  it('encrypts MFA secrets before writing and decrypts them on read', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const findFirst = jest.fn();
    const prisma = {
      user: { update, findFirst },
    } as unknown as PrismaService;
    const repository = new PrismaAuthRepository(prisma, config);

    await repository.saveUser({
      id: persistedUser.id,
      email: persistedUser.email,
      passwordHash: persistedUser.passwordHash,
      fullName: persistedUser.fullName,
      status: 'ACTIVE',
      roles: ['LAWYER'],
      mfaEnabled: true,
      mfaSecret: 'TESTSECRET',
      recoveryCodeHashes: [],
      failedLoginAttempts: 0,
    });

    const encrypted = update.mock.calls[0][0].data.mfaSecretEncrypted as string;
    expect(encrypted).not.toBe('TESTSECRET');
    findFirst.mockResolvedValue({ ...persistedUser, mfaSecretEncrypted: encrypted });

    await expect(repository.findUser(persistedUser.id)).resolves.toEqual(
      expect.objectContaining({ mfaSecret: 'TESTSECRET', mfaEnabled: false }),
    );
  });

  it('marks password reset tokens as used without touching another token', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const prisma = {
      passwordResetToken: { updateMany },
    } as unknown as PrismaService;
    const repository = new PrismaAuthRepository(prisma, config);

    await repository.markResetUsed('reset-1');

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'reset-1', usedAt: null },
      data: { usedAt: expect.any(Date) },
    });
  });
});
