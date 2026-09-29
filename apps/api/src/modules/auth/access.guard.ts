import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';

export type AuthenticatedRequest = Request & {
  auth: { sub: string; sid: string; roles: string[] };
};
@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    req.auth = await this.auth.verifyAccess(req.cookies?.lpms_access);
    return true;
  }
}
