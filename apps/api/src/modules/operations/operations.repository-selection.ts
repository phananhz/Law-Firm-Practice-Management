import type { PrismaService } from '../../database/prisma.service';
import type { OperationsRepository } from './operations.repository';

export function selectOperationsRepository(
  prisma: Pick<PrismaService, 'isEnabled'>,
  mock: OperationsRepository,
  persisted: OperationsRepository,
): OperationsRepository {
  return prisma.isEnabled ? persisted : mock;
}
