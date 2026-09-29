import { JwtService } from '@nestjs/jwt';

jest.mock('otplib', () => ({
  authenticator: {
    generateSecret: () => 'TESTSECRET',
    verify: () => true,
  },
}));

import { AuthService } from './auth.service';
import { MockAuthRepository } from './mock-auth.repository';

describe('AuthService with mock repository', () => {
  const config = {
    getOrThrow: jest.fn().mockReturnValue('test-secret-that-is-long-enough-for-jwt-signing'),
  };
  const jwt = {
    signAsync: jest.fn().mockResolvedValue('signed-token'),
    verifyAsync: jest.fn(),
  } as unknown as JwtService;

  it('creates a session for the seeded demo user', async () => {
    const service = new AuthService(new MockAuthRepository(), jwt, config as never);
    const result = await service.login('lawyer@lpms.vn', 'DemoPassword!2026', {});

    expect(result.requiresMfa).toBe(false);
    expect(result).toHaveProperty('accessToken', 'signed-token');
  });

  it('does not reveal whether an unknown email exists', async () => {
    const service = new AuthService(new MockAuthRepository(), jwt, config as never);

    await expect(service.login('unknown@lpms.vn', 'DemoPassword!2026', {})).rejects.toMatchObject({
      response: { code: 'INVALID_CREDENTIALS' },
    });
  });
});
