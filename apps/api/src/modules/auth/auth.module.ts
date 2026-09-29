import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from '../../database/database.module';
import { PrismaService } from '../../database/prisma.service';
import { AccessGuard } from './access.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AUTH_REPOSITORY } from './auth.repository';
import { selectAuthRepository } from './auth.repository-selection';
import { MockAuthRepository } from './mock-auth.repository';
import { PrismaAuthRepository } from './prisma-auth.repository';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    JwtModule.register({}),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
    DatabaseModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessGuard,
    RolesGuard,
    MockAuthRepository,
    PrismaAuthRepository,
    {
      provide: AUTH_REPOSITORY,
      inject: [PrismaService, MockAuthRepository, PrismaAuthRepository],
      useFactory: (
        prisma: PrismaService,
        mockRepository: MockAuthRepository,
        prismaRepository: PrismaAuthRepository,
      ) => selectAuthRepository(prisma, mockRepository, prismaRepository),
    },
  ],
  exports: [AccessGuard, AuthService, RolesGuard],
})
export class AuthModule {}
