import { MockPlatformRepository } from './mock-platform.repository';
import { selectPlatformRepository } from './platform.repository-selection';
import type { PlatformRepository } from './platform.repository';

describe('selectPlatformRepository', () => {
  it('selects the persisted adapter only when Prisma mode is enabled', () => {
    const mock = new MockPlatformRepository();
    const persisted = {} as PlatformRepository;
    expect(selectPlatformRepository({ isEnabled: false }, mock, persisted)).toBe(mock);
    expect(selectPlatformRepository({ isEnabled: true }, mock, persisted)).toBe(persisted);
  });
});
