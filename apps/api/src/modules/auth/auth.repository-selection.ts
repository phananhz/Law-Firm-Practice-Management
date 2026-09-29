import type { PrismaService } from '../../database/prisma.service';
import type { AuthRepository } from './auth.repository';

export function selectAuthRepository(
  prisma: Pick<PrismaService, 'isEnabled'>,
  mockRepository: AuthRepository,
  prismaRepository: AuthRepository,
): AuthRepository {
  return prisma.isEnabled ? prismaRepository : mockRepository;
}
