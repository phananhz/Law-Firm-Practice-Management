import { selectOrganizationRepository } from './organization.repository-selection';

describe('Organization repository selection', () => {
  const mockRepository = {} as never;
  const prismaRepository = {} as never;

  it('keeps mock mode as the default', () => {
    expect(
      selectOrganizationRepository({ isEnabled: false }, mockRepository, prismaRepository),
    ).toBe(mockRepository);
  });

  it('selects Prisma only after explicit enablement', () => {
    expect(
      selectOrganizationRepository({ isEnabled: true }, mockRepository, prismaRepository),
    ).toBe(prismaRepository);
  });
});
