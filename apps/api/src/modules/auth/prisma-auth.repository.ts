import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, UserStatus } from '@prisma/client';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import type { AuthRepository, AuthResetToken, AuthSession, AuthUser } from './auth.repository';

type UserWithRoles = Prisma.UserGetPayload<{
  include: { roles: { include: { role: true } } };
}>;

@Injectable()
export class PrismaAuthRepository implements AuthRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async findUserByEmail(email: string): Promise<AuthUser | undefined> {
    const user = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
      include: { roles: { include: { role: true } } },
    });
    return user ? this.mapUser(user) : undefined;
  }

  async findUser(id: string): Promise<AuthUser | undefined> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { roles: { include: { role: true } } },
    });
    return user ? this.mapUser(user) : undefined;
  }

  async saveUser(user: AuthUser): Promise<void> {
    const data: Prisma.UserUpdateInput = {
      passwordHash: user.passwordHash,
      status: user.status as UserStatus,
      mfaEnabled: user.mfaEnabled,
      recoveryCodeHashes: user.recoveryCodeHashes as Prisma.InputJsonValue,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil ?? null,
    };
    if (user.mfaSecret !== undefined) data.mfaSecretEncrypted = this.encrypt(user.mfaSecret);
    await this.prisma.user.update({ where: { id: user.id }, data });
  }

  async createSession(
    input: Omit<AuthSession, 'id' | 'createdAt' | 'isRevoked'>,
  ): Promise<AuthSession> {
    const session = await this.prisma.refreshSession.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        expiresAt: input.expiresAt,
      },
    });
    return this.mapSession(session);
  }

  async findSessionByTokenHash(tokenHash: string): Promise<AuthSession | undefined> {
    const session = await this.prisma.refreshSession.findUnique({ where: { tokenHash } });
    return session ? this.mapSession(session) : undefined;
  }

  async revokeSession(id: string): Promise<void> {
    await this.prisma.refreshSession.updateMany({
      where: { id, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async revokeUserSessions(userId: string, exceptId?: string): Promise<void> {
    await this.prisma.refreshSession.updateMany({
      where: {
        userId,
        isRevoked: false,
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      data: { isRevoked: true },
    });
  }

  async sessionsForUser(userId: string): Promise<AuthSession[]> {
    const sessions = await this.prisma.refreshSession.findMany({
      where: { userId, isRevoked: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    return sessions.map((session) => this.mapSession(session));
  }

  async createReset(input: Omit<AuthResetToken, 'id'>): Promise<AuthResetToken> {
    const reset = await this.prisma.passwordResetToken.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        usedAt: input.usedAt,
      },
    });
    return this.mapReset(reset);
  }

  async findResetByHash(tokenHash: string): Promise<AuthResetToken | undefined> {
    const reset = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    return reset ? this.mapReset(reset) : undefined;
  }

  async markResetUsed(id: string): Promise<void> {
    await this.prisma.passwordResetToken.updateMany({
      where: { id, usedAt: null },
      data: { usedAt: new Date() },
    });
  }

  async audit(action: string, userId?: string): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action,
        resourceType: 'AUTH',
        resourceId: userId,
        userId,
      },
    });
  }

  private mapUser(user: UserWithRoles): AuthUser {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      fullName: user.fullName,
      status: user.status,
      roles: user.roles.map(({ role }) => role.name),
      mfaEnabled: user.mfaEnabled,
      ...(user.mfaSecretEncrypted ? { mfaSecret: this.decrypt(user.mfaSecretEncrypted) } : {}),
      recoveryCodeHashes: this.recoveryCodes(user.recoveryCodeHashes),
      failedLoginAttempts: user.failedLoginAttempts,
      ...(user.lockedUntil ? { lockedUntil: user.lockedUntil } : {}),
    };
  }

  private mapSession(session: {
    id: string;
    userId: string;
    tokenHash: string;
    ipAddress: string | null;
    userAgent: string | null;
    expiresAt: Date;
    isRevoked: boolean;
    createdAt: Date;
  }): AuthSession {
    return {
      id: session.id,
      userId: session.userId,
      tokenHash: session.tokenHash,
      ...(session.ipAddress ? { ipAddress: session.ipAddress } : {}),
      ...(session.userAgent ? { userAgent: session.userAgent } : {}),
      expiresAt: session.expiresAt,
      isRevoked: session.isRevoked,
      createdAt: session.createdAt,
    };
  }

  private mapReset(reset: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    usedAt: Date | null;
  }): AuthResetToken {
    return {
      id: reset.id,
      userId: reset.userId,
      tokenHash: reset.tokenHash,
      expiresAt: reset.expiresAt,
      ...(reset.usedAt ? { usedAt: reset.usedAt } : {}),
    };
  }

  private recoveryCodes(value: Prisma.JsonValue | null): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
  }

  private encryptionKey(): Buffer {
    return createHash('sha256')
      .update(this.config.getOrThrow<string>('AUTH_ENCRYPTION_KEY'))
      .digest();
  }

  private encrypt(value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64url')).join('.');
  }

  private decrypt(value: string): string {
    const [ivEncoded, tagEncoded, encryptedEncoded] = value.split('.');
    if (!ivEncoded || !tagEncoded || !encryptedEncoded)
      throw new Error('Invalid encrypted MFA secret');
    const decipher = createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey(),
      Buffer.from(ivEncoded, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tagEncoded, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedEncoded, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }
}
