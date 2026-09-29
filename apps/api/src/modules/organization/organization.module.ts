import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { PrismaService } from '../../database/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { AuthorizationController } from './authorization.controller';
import { OrganizationController } from './organization.controller';
import { MockOrganizationRepository } from './mock-organization.repository';
import { ORGANIZATION_REPOSITORY } from './organization.repository';
import { selectOrganizationRepository } from './organization.repository-selection';
import { PrismaOrganizationRepository } from './prisma-organization.repository';
import { UsersController } from './users.controller';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [OrganizationController, UsersController, AuthorizationController],
  providers: [
    MockOrganizationRepository,
    PrismaOrganizationRepository,
    {
      provide: ORGANIZATION_REPOSITORY,
      inject: [PrismaService, MockOrganizationRepository, PrismaOrganizationRepository],
      useFactory: (
        prisma: PrismaService,
        mockRepository: MockOrganizationRepository,
        prismaRepository: PrismaOrganizationRepository,
      ) => selectOrganizationRepository(prisma, mockRepository, prismaRepository),
    },
  ],
  exports: [ORGANIZATION_REPOSITORY],
})
export class OrganizationModule {}
