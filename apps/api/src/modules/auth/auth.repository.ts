export const AUTH_REPOSITORY = 'AUTH_REPOSITORY';

export type AuthUser = {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'RESIGNED';
  roles: string[];
  mfaEnabled: boolean;
  mfaSecret?: string;
  recoveryCodeHashes: string[];
  failedLoginAttempts: number;
  lockedUntil?: Date;
};

export type AuthSession = {
  id: string;
  userId: string;
  tokenHash: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
};

export type AuthResetToken = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date;
};

export interface AuthRepository {
  findUserByEmail(email: string): Promise<AuthUser | undefined>;
  findUser(id: string): Promise<AuthUser | undefined>;
  saveUser(user: AuthUser): Promise<void>;
  createSession(input: Omit<AuthSession, 'id' | 'createdAt' | 'isRevoked'>): Promise<AuthSession>;
  findSessionByTokenHash(tokenHash: string): Promise<AuthSession | undefined>;
  revokeSession(id: string): Promise<void>;
  revokeUserSessions(userId: string, exceptId?: string): Promise<void>;
  sessionsForUser(userId: string): Promise<AuthSession[]>;
  createReset(input: Omit<AuthResetToken, 'id'>): Promise<AuthResetToken>;
  findResetByHash(tokenHash: string): Promise<AuthResetToken | undefined>;
  markResetUsed(id: string): Promise<void>;
  audit(action: string, userId?: string): Promise<void>;
}
