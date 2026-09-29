import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { ClientsModule } from './modules/clients/clients.module';
import { OperationsModule } from './modules/operations/operations.module';
import { PlatformModule } from './modules/platform/platform.module';
import { DatabaseModule } from './database/database.module';
import { QueueModule } from './modules/queues/queue.module';
import { CalendarModule } from './modules/calendar/calendar.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'staging', 'production')
          .default('development'),
        API_PORT: Joi.number().port().default(3001),
        WEB_ORIGIN: Joi.string().uri().default('http://localhost:3000'),
        JWT_ACCESS_SECRET: Joi.string().min(32).required(),
        AUTH_ENCRYPTION_KEY: Joi.when('PERSISTENCE_MODE', {
          is: 'prisma',
          then: Joi.string().min(32).required(),
          otherwise: Joi.string().min(32).optional(),
        }),
        PERSISTENCE_MODE: Joi.string().valid('mock', 'prisma').default('mock'),
        STORAGE_MODE: Joi.string().valid('mock', 'r2').default('mock'),
        QUEUE_INTERNAL_SECRET: Joi.when('NODE_ENV', {
          is: 'production',
          then: Joi.string().min(32).required(),
          otherwise: Joi.string().min(32).optional(),
        }),
      }),
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    OrganizationModule,
    ClientsModule,
    OperationsModule,
    PlatformModule,
    QueueModule,
    CalendarModule,
  ],
})
export class AppModule {}
