import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerException } from '@nestjs/throttler';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { generateSecret, verifySync } from 'otplib';
import { AUTH_REPOSITORY, type AuthRepository, type AuthUser } from './auth.repository';

type Context = { ipAddress?: string; userAgent?: string };
type Claims = { sub: string; sid: string; roles: string[]; purpose?: 'mfa' };

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_REPOSITORY) private readonly repo: AuthRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string, context: Context) {
    const user = await this.repo.findUserByEmail(email);
    if (
      !user ||
      user.status !== 'ACTIVE' ||
      (user.lockedUntil && user.lockedUntil > new Date()) ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      if (user) await this.fail(user);
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email hoặc mật khẩu không chính xác.',
      });
    }
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    await this.repo.saveUser(user);
    if (user.mfaEnabled)
      return {
        requiresMfa: true,
        mfaSessionToken: await this.sign(
          { sub: user.id, sid: 'mfa', roles: [], purpose: 'mfa' },
          '5m',
        ),
        message: 'Vui lòng nhập mã xác thực MFA.',
      };
    return { requiresMfa: false, ...(await this.createSession(user, context)) };
  }

  async verifyMfa(mfaSessionToken: string, code: string, context: Context) {
    const claims = await this.verify(mfaSessionToken, 'MFA_INVALID_CODE');
    const user = await this.repo.findUser(claims.sub);
    const recoveryMatch = user
      ? await Promise.all(user.recoveryCodeHashes.map((hash) => bcrypt.compare(code, hash))).then(
          (checks) => checks.findIndex(Boolean),
        )
      : -1;
    const validTotp = Boolean(
      user?.mfaSecret && verifySync({ token: code, secret: user.mfaSecret }).valid,
    );
    if (!user || claims.purpose !== 'mfa' || (!validTotp && recoveryMatch < 0))
      throw new UnauthorizedException({
        code: 'MFA_INVALID_CODE',
        message: 'Mã xác thực không hợp lệ hoặc đã hết hạn.',
      });
    if (recoveryMatch >= 0) user.recoveryCodeHashes.splice(recoveryMatch, 1);
    await this.repo.saveUser(user);
    return this.createSession(user, context);
  }

  async refresh(token: string | undefined, context: Context) {
    if (!token)
      throw new UnauthorizedException({
        code: 'AUTH_UNAUTHORIZED',
        message: 'Phiên đăng nhập không hợp lệ.',
      });
    const session = await this.repo.findSessionByTokenHash(this.hash(token));
    const user = session && (await this.repo.findUser(session.userId));
    if (
      !session ||
      !user ||
      session.isRevoked ||
      session.expiresAt <= new Date() ||
      user.status !== 'ACTIVE'
    )
      throw new UnauthorizedException({
        code: 'AUTH_UNAUTHORIZED',
        message: 'Phiên đăng nhập không hợp lệ.',
      });
    await this.repo.revokeSession(session.id);
    return this.createSession(user, context);
  }

  async logout(sessionId?: string) {
    if (sessionId) await this.repo.revokeSession(sessionId);
  }
  async revokeSession(userId: string, sessionId: string) {
    const session = (await this.repo.sessionsForUser(userId)).find((item) => item.id === sessionId);
    if (session) await this.repo.revokeSession(session.id);
  }
  async revokeAll(userId: string, exceptId?: string) {
    await this.repo.revokeUserSessions(userId, exceptId);
  }
  async sessions(userId: string, currentId?: string) {
    return (await this.repo.sessionsForUser(userId)).map((session) => ({
      id: session.id,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isCurrent: session.id === currentId,
    }));
  }
  async me(userId: string) {
    const user = await this.repo.findUser(userId);
    if (!user || user.status !== 'ACTIVE')
      throw new UnauthorizedException({
        code: 'AUTH_UNAUTHORIZED',
        message: 'Phiên đăng nhập không hợp lệ.',
      });
    return this.summary(user);
  }
  async forgotPassword(email: string) {
    const user = await this.repo.findUserByEmail(email);
    if (user?.status === 'ACTIVE')
      await this.repo.createReset({
        userId: user.id,
        tokenHash: this.hash(randomBytes(32).toString('base64url')),
        expiresAt: new Date(Date.now() + 3_600_000),
      });
    return {
      message: 'Nếu địa chỉ email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi đến bạn.',
    };
  }
  async resetPassword(token: string, password: string) {
    const reset = await this.repo.findResetByHash(this.hash(token));
    if (!reset || reset.usedAt || reset.expiresAt <= new Date())
      throw new BadRequestException({
        code: 'TOKEN_EXPIRED',
        message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
      });
    const user = await this.repo.findUser(reset.userId);
    if (!user)
      throw new BadRequestException({
        code: 'TOKEN_EXPIRED',
        message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
      });
    user.passwordHash = await bcrypt.hash(password, 12);
    reset.usedAt = new Date();
    await this.repo.saveUser(user);
    await this.repo.markResetUsed(reset.id);
    await this.repo.revokeUserSessions(user.id);
    return { message: 'Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại.' };
  }
  async beginMfa(userId: string) {
    const user = await this.repo.findUser(userId);
    if (!user) throw new UnauthorizedException();
    const secret = generateSecret();
    user.mfaSecret = secret;
    await this.repo.saveUser(user);
    return {
      secret,
      otpauthUri: `otpauth://totp/LPMS:${encodeURIComponent(user.email)}?secret=${secret}&issuer=LPMS`,
    };
  }
  async confirmMfa(userId: string, code: string) {
    const user = await this.repo.findUser(userId);
    if (!user?.mfaSecret || !verifySync({ token: code, secret: user.mfaSecret }).valid)
      throw new BadRequestException({ code: 'MFA_INVALID_CODE', message: 'Mã MFA không hợp lệ.' });
    user.mfaEnabled = true;
    const codes = Array.from({ length: 8 }, () => randomBytes(5).toString('hex').toUpperCase());
    user.recoveryCodeHashes = await Promise.all(codes.map((item) => bcrypt.hash(item, 12)));
    await this.repo.saveUser(user);
    return { recoveryCodes: codes };
  }
  async verifyAccess(token?: string): Promise<Claims> {
    return this.verify(token, 'AUTH_TOKEN_EXPIRED');
  }
  private async createSession(user: AuthUser, context: Context) {
    const refreshToken = randomBytes(48).toString('base64url');
    const session = await this.repo.createSession({
      userId: user.id,
      tokenHash: this.hash(refreshToken),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      expiresAt: new Date(Date.now() + 604_800_000),
    });
    await this.repo.audit('LOGIN_SUCCESS', user.id);
    return {
      user: this.summary(user),
      accessToken: await this.sign({ sub: user.id, sid: session.id, roles: user.roles }, '15m'),
      refreshToken,
      sessionId: session.id,
      message: 'Đăng nhập thành công.',
    };
  }
  private async fail(user: AuthUser) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= 5) user.lockedUntil = new Date(Date.now() + 900_000);
    await this.repo.saveUser(user);
    await this.repo.audit('LOGIN_FAILED', user.id);
    if (user.lockedUntil)
      throw new ThrottlerException('Tài khoản tạm thời bị khóa. Vui lòng thử lại sau.');
  }
  private summary(user: AuthUser) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      status: user.status,
      mfaEnabled: user.mfaEnabled,
      roles: user.roles,
    };
  }
  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
  private sign(claims: Claims, expiresIn: '5m' | '15m') {
    return this.jwt.signAsync(claims, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn,
    });
  }
  private async verify(token: string | undefined, code: string) {
    if (!token) throw new UnauthorizedException({ code, message: 'Phiên đăng nhập không hợp lệ.' });
    try {
      return await this.jwt.verifyAsync<Claims>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException({ code, message: 'Phiên đăng nhập không hợp lệ.' });
    }
  }
}
