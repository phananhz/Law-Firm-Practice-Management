import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from './access.guard';

export const REQUIRED_ROLES = 'lpms:required-roles';
export const RequireRoles = (...roles: string[]) => SetMetadata(REQUIRED_ROLES, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(REQUIRED_ROLES, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const roles = request.auth?.roles ?? [];
    if (required.some((role) => roles.includes(role))) return true;
    throw new ForbiddenException({
      code: 'AUTH_FORBIDDEN',
      message: 'Tài khoản không có quyền thực hiện thao tác này.',
    });
  }
}
