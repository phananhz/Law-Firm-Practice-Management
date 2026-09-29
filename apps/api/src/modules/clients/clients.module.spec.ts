import { selectClientsRepository } from './clients.repository-selection';

describe('ClientsModule repository selection', () => {
  const mockRepository = {} as never;
  const prismaRepository = {} as never;

  it('uses the mock adapter unless Prisma persistence is explicitly enabled', () => {
    expect(selectClientsRepository({ isEnabled: false }, mockRepository, prismaRepository)).toBe(
      mockRepository,
    );
  });

  it('uses the Prisma adapter when persistence is enabled', () => {
    expect(selectClientsRepository({ isEnabled: true }, mockRepository, prismaRepository)).toBe(
      prismaRepository,
    );
  });
});
