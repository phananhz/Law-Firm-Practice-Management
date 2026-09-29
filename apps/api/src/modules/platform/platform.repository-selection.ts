import type { PrismaService } from '../../database/prisma.service';
import type { PlatformRepository } from './platform.repository';

export function selectPlatformRepository(
  prisma: Pick<PrismaService, 'isEnabled'>,
  mock: PlatformRepository,
  persisted: PlatformRepository,
): PlatformRepository {
  return prisma.isEnabled ? persisted : mock;
}
