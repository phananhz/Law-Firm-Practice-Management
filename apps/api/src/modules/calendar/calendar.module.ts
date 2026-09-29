import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { CalendarController } from './calendar.controller';
import { CALENDAR_REPOSITORY } from './calendar.repository';
import { selectCalendarRepository } from './calendar.repository-selection';
import { MockCalendarRepository } from './mock-calendar.repository';
import { PrismaCalendarRepository } from './prisma-calendar.repository';
import { PrismaService } from '../../database/prisma.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [CalendarController],
  providers: [
    MockCalendarRepository,
    PrismaCalendarRepository,
    {
      provide: CALENDAR_REPOSITORY,
      inject: [PrismaService, MockCalendarRepository, PrismaCalendarRepository],
      useFactory: selectCalendarRepository,
    },
  ],
  exports: [CALENDAR_REPOSITORY],
})
export class CalendarModule {}
