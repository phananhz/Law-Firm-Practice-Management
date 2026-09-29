import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import type { AuthRepository, AuthResetToken, AuthSession, AuthUser } from './auth.repository';

export type MockUser = AuthUser;
export type MockSession = AuthSession;
export type ResetToken = AuthResetToken;

@Injectable()
export class MockAuthRepository implements AuthRepository {
  private readonly users = new Map<string, MockUser>();
  private readonly sessions = new Map<string, MockSession>();
  private readonly resets = new Map<string, ResetToken>();
  readonly audits: Array<{ action: string; userId?: string; createdAt: Date }> = [];

  constructor() {
    void this.seed();
  }
  private async seed(): Promise<void> {
    const passwordHash = await bcrypt.hash('DemoPassword!2026', 12);
    const users: MockUser[] = [
      {
        id: '00000000-0000-4000-8000-000000000001',
        email: 'admin@lpms.vn',
        passwordHash,
        fullName: 'Nguyễn Minh Khôi',
        status: 'ACTIVE',
        roles: ['SYSTEM_ADMIN'],
        mfaEnabled: false,
        recoveryCodeHashes: [],
        failedLoginAttempts: 0,
      },
      {
        id: '00000000-0000-4000-8000-000000000002',
        email: 'director@lpms.vn',
        passwordHash,
        fullName: 'Nguyễn Văn An',
        status: 'ACTIVE',
        roles: ['MANAGING_PARTNER'],
        mfaEnabled: false,
        recoveryCodeHashes: [],
        failedLoginAttempts: 0,
      },
      {
        id: '00000000-0000-4000-8000-000000000003',
        email: 'lawyer@lpms.vn',
        passwordHash,
        fullName: 'Lê Hoàng Nam',
        status: 'ACTIVE',
        roles: ['LAWYER'],
        mfaEnabled: false,
        recoveryCodeHashes: [],
        failedLoginAttempts: 0,
      },
      {
        id: '00000000-0000-4000-8000-000000000004',
        email: 'paralegal@lpms.vn',
        passwordHash,
        fullName: 'Phạm Thu Trang',
        status: 'ACTIVE',
        roles: ['PARALEGAL'],
        mfaEnabled: false,
        recoveryCodeHashes: [],
        failedLoginAttempts: 0,
      },
    ];
    users.forEach((user) => this.users.set(user.id, user));
  }
  async findUserByEmail(email: string) {
    await this.ready();
    return [...this.users.values()].find((user) => user.email === email.toLowerCase());
  }
  async findUser(id: string) {
    await this.ready();
    return this.users.get(id);
  }
  async saveUser(user: MockUser) {
    this.users.set(user.id, user);
  }
  async createSession(input: Omit<MockSession, 'id' | 'createdAt' | 'isRevoked'>) {
    const session: MockSession = {
      ...input,
      id: randomUUID(),
      createdAt: new Date(),
      isRevoked: false,
    };
    this.sessions.set(session.id, session);
    return session;
  }
  async findSessionByTokenHash(tokenHash: string) {
    return [...this.sessions.values()].find((session) => session.tokenHash === tokenHash);
  }
  async revokeSession(id: string) {
    const session = this.sessions.get(id);
    if (session) session.isRevoked = true;
  }
  async revokeUserSessions(userId: string, exceptId?: string) {
    for (const session of this.sessions.values())
      if (session.userId === userId && session.id !== exceptId) session.isRevoked = true;
  }
  async sessionsForUser(userId: string) {
    return [...this.sessions.values()].filter(
      (session) =>
        session.userId === userId && !session.isRevoked && session.expiresAt > new Date(),
    );
  }
  async createReset(input: Omit<ResetToken, 'id'>) {
    const token = { ...input, id: randomUUID() };
    this.resets.set(token.id, token);
    return token;
  }
  async findResetByHash(tokenHash: string) {
    return [...this.resets.values()].find((token) => token.tokenHash === tokenHash);
  }
  async markResetUsed(id: string) {
    const reset = this.resets.get(id);
    if (reset) reset.usedAt = new Date();
  }
  async audit(action: string, userId?: string) {
    this.audits.push({ action, userId, createdAt: new Date() });
  }
  private async ready() {
    while (this.users.size === 0) await new Promise((resolve) => setTimeout(resolve, 1));
  }
}
