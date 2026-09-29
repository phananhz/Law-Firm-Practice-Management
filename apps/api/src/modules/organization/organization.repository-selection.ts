import type { PrismaService } from '../../database/prisma.service';
import type { OrganizationRepository } from './organization.repository';

export function selectOrganizationRepository(
  prisma: Pick<PrismaService, 'isEnabled'>,
  mockRepository: OrganizationRepository,
  prismaRepository: OrganizationRepository,
): OrganizationRepository {
  return prisma.isEnabled ? prismaRepository : mockRepository;
}
