import { ForbiddenException } from '@nestjs/common';
import { RolesGuard, REQUIRED_ROLES } from './roles.guard';

describe('RolesGuard', () => {
  it('allows a matching role and rejects an IDOR-style role mismatch', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['SYSTEM_ADMIN']),
    };
    const guard = new RolesGuard(reflector as never);
    const allowed = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => ({ auth: { roles: ['SYSTEM_ADMIN'] } }) }),
    } as never;
    expect(guard.canActivate(allowed)).toBe(true);

    const denied = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => ({ auth: { roles: ['LAWYER'] } }) }),
    } as never;
    expect(() => guard.canActivate(denied)).toThrow(ForbiddenException);
    expect(REQUIRED_ROLES).toBe('lpms:required-roles');
  });
});
