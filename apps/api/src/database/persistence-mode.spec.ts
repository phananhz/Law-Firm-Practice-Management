import { getPersistenceMode } from './persistence-mode';

describe('getPersistenceMode', () => {
  it('keeps mock as the safe default', () => {
    expect(getPersistenceMode(undefined)).toBe('mock');
    expect(getPersistenceMode('invalid')).toBe('mock');
  });

  it('enables Prisma only with an explicit opt-in', () => {
    expect(getPersistenceMode('prisma')).toBe('prisma');
  });
});
