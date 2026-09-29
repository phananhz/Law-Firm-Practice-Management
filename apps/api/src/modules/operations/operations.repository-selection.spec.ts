import { MockOperationsRepository } from './mock-operations.repository';
import { selectOperationsRepository } from './operations.repository-selection';
import type { OperationsRepository } from './operations.repository';

describe('selectOperationsRepository', () => {
  it('keeps mock mode isolated from the Prisma repository', () => {
    const mock = new MockOperationsRepository();
    const persisted = {} as OperationsRepository;
    expect(selectOperationsRepository({ isEnabled: false }, mock, persisted)).toBe(mock);
    expect(selectOperationsRepository({ isEnabled: true }, mock, persisted)).toBe(persisted);
  });
});
