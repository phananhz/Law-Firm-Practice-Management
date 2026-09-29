import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../../database/database.module';
import { PrismaService } from '../../database/prisma.service';
import { ClientsController } from './clients.controller';
import { CLIENTS_REPOSITORY } from './clients.repository';
import { MockClientsRepository } from './mock-clients.repository';
import { PrismaClientsRepository } from './prisma-clients.repository';
import { selectClientsRepository } from './clients.repository-selection';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [ClientsController],
  providers: [
    MockClientsRepository,
    PrismaClientsRepository,
    {
      provide: CLIENTS_REPOSITORY,
      inject: [PrismaService, MockClientsRepository, PrismaClientsRepository],
      useFactory: (
        prisma: PrismaService,
        mockRepository: MockClientsRepository,
        prismaRepository: PrismaClientsRepository,
      ) => selectClientsRepository(prisma, mockRepository, prismaRepository),
    },
  ],
  exports: [CLIENTS_REPOSITORY],
})
export class ClientsModule {}
