import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  ConfirmMfaDto,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
  VerifyMfaDto,
} from './auth.dto';
import { AccessGuard, type AuthenticatedRequest } from './access.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('login') @Throttle({ default: { limit: 5, ttl: 60_000 } }) async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(dto.email, dto.password, this.context(req));
    return this.setCookies(result, res);
  }
  @Post('mfa/verify') @Throttle({ default: { limit: 5, ttl: 60_000 } }) async verifyMfa(
    @Body() dto: VerifyMfaDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.setCookies(
      await this.auth.verifyMfa(dto.mfaSessionToken, dto.code, this.context(req)),
      res,
    );
  }
  @Post('refresh') async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.setCookies(
      await this.auth.refresh(req.cookies?.lpms_refresh, this.context(req)),
      res,
    );
  }
  @Post('forgot-password') @Throttle({ default: { limit: 3, ttl: 60_000 } }) forgot(
    @Body() dto: ForgotPasswordDto,
  ) {
    return this.auth.forgotPassword(dto.email);
  }
  @Post('reset-password') reset(@Body() dto: ResetPasswordDto) {
    return this.auth
      .resetPassword(dto.token, dto.newPassword)
      .then(() => ({ message: 'Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại.' }));
  }
  @UseGuards(AccessGuard) @Post('logout') async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(req.auth.sid);
    this.clearCookies(res);
    return { message: 'Đăng xuất thành công.' };
  }
  @UseGuards(AccessGuard) @Get('me') me(@Req() req: AuthenticatedRequest) {
    return this.auth.me(req.auth.sub);
  }
  @UseGuards(AccessGuard) @Get('sessions') sessions(@Req() req: AuthenticatedRequest) {
    return this.auth.sessions(req.auth.sub, req.auth.sid);
  }
  @UseGuards(AccessGuard) @Post('mfa/setup') setupMfa(@Req() req: AuthenticatedRequest) {
    return this.auth.beginMfa(req.auth.sub);
  }
  @UseGuards(AccessGuard) @Post('mfa/confirm') confirmMfa(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ConfirmMfaDto,
  ) {
    return this.auth.confirmMfa(req.auth.sub, dto.code);
  }
  @UseGuards(AccessGuard) @Post('sessions/revoke/:id') async revoke(
    @Req() req: AuthenticatedRequest & { params: { id: string } },
  ) {
    await this.auth.revokeSession(req.auth.sub, req.params.id);
    return { message: 'Đã thu hồi phiên.' };
  }
  @UseGuards(AccessGuard) @Post('sessions/revoke-all') async revokeAll(
    @Req() req: AuthenticatedRequest,
  ) {
    await this.auth.revokeAll(req.auth.sub, req.auth.sid);
    return { message: 'Đã thu hồi các phiên khác.' };
  }
  private context(req: Request) {
    return {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      requestId: (req as Request & { requestId?: string }).requestId,
    };
  }
  private setCookies(
    result: {
      accessToken?: string;
      refreshToken?: string;
      user?: object;
      message: string;
      requiresMfa?: boolean;
      mfaSessionToken?: string;
    },
    res: Response,
  ) {
    if (!result.accessToken || !result.refreshToken) return result;
    const secure = process.env.NODE_ENV === 'production';
    res.cookie('lpms_access', result.accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
    res.cookie('lpms_refresh', result.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });
    return { requiresMfa: false, user: result.user, message: result.message };
  }
  private clearCookies(res: Response) {
    res.clearCookie('lpms_access', { path: '/' });
    res.clearCookie('lpms_refresh', { path: '/api/v1/auth' });
  }
}
