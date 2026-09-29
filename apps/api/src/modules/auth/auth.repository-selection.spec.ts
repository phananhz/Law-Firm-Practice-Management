import { selectAuthRepository } from './auth.repository-selection';

describe('selectAuthRepository', () => {
  it('selects Prisma when persistence is enabled', () => {
    const mock = {} as never;
    const prisma = {} as never;
    expect(selectAuthRepository({ isEnabled: true }, mock, prisma)).toBe(prisma);
  });

  it('selects mock when persistence is disabled', () => {
    const mock = {} as never;
    const prisma = {} as never;
    expect(selectAuthRepository({ isEnabled: false }, mock, prisma)).toBe(mock);
  });
});
