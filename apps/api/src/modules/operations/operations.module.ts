import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../../database/database.module';
import { PrismaService } from '../../database/prisma.service';
import { OperationsController } from './operations.controller';
import { MockOperationsRepository } from './mock-operations.repository';
import { StorageModule } from '../storage/storage.module';
import { OPERATIONS_REPOSITORY } from './operations.repository';
import { PrismaOperationsRepository } from './prisma-operations.repository';
import { selectOperationsRepository } from './operations.repository-selection';

@Module({
  imports: [AuthModule, StorageModule, DatabaseModule],
  controllers: [OperationsController],
  providers: [
    MockOperationsRepository,
    PrismaOperationsRepository,
    {
      provide: OPERATIONS_REPOSITORY,
      inject: [PrismaService, MockOperationsRepository, PrismaOperationsRepository],
      useFactory: selectOperationsRepository,
    },
  ],
  exports: [OPERATIONS_REPOSITORY],
})
export class OperationsModule {}
