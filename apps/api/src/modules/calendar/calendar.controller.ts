import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { RequestWithContext } from '../../common/middleware/request-context.middleware';
import { AccessGuard } from '../auth/access.guard';
import { RequireRoles, RolesGuard } from '../auth/roles.guard';
import { CALENDAR_REPOSITORY } from './calendar.repository';
import type { CalendarEventInput, CalendarRepository } from './calendar.repository';

@Controller('calendar/events')
@UseGuards(AccessGuard, RolesGuard)
export class CalendarController {
  constructor(@Inject(CALENDAR_REPOSITORY) private readonly repository: CalendarRepository) {}

  @Get()
  async list(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('matterId') matterId: string | undefined,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(
      await this.repository.list(from, to, matterId, this.context(request)),
      request,
    );
  }

  @Get(':id')
  async find(@Param('id') id: string, @Req() request: RequestWithContext) {
    return this.envelope(await this.repository.find(id, this.context(request)), request);
  }

  @Post()
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER', 'LAWYER', 'PARALEGAL')
  async create(@Body() body: CalendarEventInput, @Req() request: RequestWithContext) {
    return this.envelope(await this.repository.create(body, this.context(request)), request);
  }

  @Patch(':id')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER', 'LAWYER', 'PARALEGAL')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<CalendarEventInput>,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(await this.repository.update(id, body, this.context(request)), request);
  }

  @Delete(':id')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER', 'PARTNER')
  async remove(@Param('id') id: string, @Req() request: RequestWithContext) {
    return this.envelope(await this.repository.remove(id, this.context(request)), request);
  }

  private envelope<T>(data: T, request: RequestWithContext) {
    return {
      data,
      meta: { requestId: request.requestId ?? 'unknown', timestamp: new Date().toISOString() },
    };
  }

  private context(request: RequestWithContext) {
    const auth = (request as RequestWithContext & { auth: { sub: string; roles: string[] } }).auth;
    return { userId: auth.sub, roles: auth.roles };
  }
}
