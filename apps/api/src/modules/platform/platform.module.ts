import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../../database/database.module';
import { PrismaService } from '../../database/prisma.service';
import { PlatformController } from './platform.controller';
import { MockPlatformRepository } from './mock-platform.repository';
import { PLATFORM_REPOSITORY } from './platform.repository';
import { PrismaPlatformRepository } from './prisma-platform.repository';
import { selectPlatformRepository } from './platform.repository-selection';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [PlatformController],
  providers: [
    MockPlatformRepository,
    PrismaPlatformRepository,
    {
      provide: PLATFORM_REPOSITORY,
      inject: [PrismaService, MockPlatformRepository, PrismaPlatformRepository],
      useFactory: selectPlatformRepository,
    },
  ],
  exports: [PLATFORM_REPOSITORY],
})
export class PlatformModule {}
