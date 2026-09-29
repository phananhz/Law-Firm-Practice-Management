import type { PrismaService } from '../../database/prisma.service';
import type { ClientsRepository } from './clients.repository';

export function selectClientsRepository(
  prisma: Pick<PrismaService, 'isEnabled'>,
  mockRepository: ClientsRepository,
  prismaRepository: ClientsRepository,
): ClientsRepository {
  return prisma.isEnabled ? prismaRepository : mockRepository;
}
