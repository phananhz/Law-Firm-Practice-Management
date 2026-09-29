import { Controller, Get, Inject, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { RequestWithContext } from '../../common/middleware/request-context.middleware';
import { AccessGuard } from '../auth/access.guard';
import { RequireRoles, RolesGuard } from '../auth/roles.guard';
import { PLATFORM_REPOSITORY } from './platform.repository';
import type { PlatformRepository } from './platform.repository';

@Controller()
@UseGuards(AccessGuard, RolesGuard)
export class PlatformController {
  constructor(@Inject(PLATFORM_REPOSITORY) private readonly repository: PlatformRepository) {}

  @Get('notifications')
  async notifications(
    @Query('unreadOnly') unreadOnly: string | undefined,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(
      await this.repository.listNotifications(unreadOnly === 'true', this.userContext(request)),
      request,
    );
  }

  @Patch('notifications/:id/read')
  async readNotification(@Param('id') id: string, @Req() request: RequestWithContext) {
    return this.envelope(
      await this.repository.markNotificationRead(id, this.userContext(request)),
      request,
    );
  }

  @Post('notifications/read-all')
  async readAllNotifications(@Req() request: RequestWithContext) {
    return this.envelope(
      await this.repository.markAllNotificationsRead(this.userContext(request)),
      request,
    );
  }

  @Get('search')
  async search(
    @Query('q') query: string | undefined,
    @Query('type') type: string | undefined,
    @Req() request: RequestWithContext,
  ) {
    const allowed = ['CLIENT', 'MATTER', 'TASK', 'DOCUMENT', 'DEADLINE'] as const;
    const normalizedType = allowed.includes(type as (typeof allowed)[number])
      ? (type as (typeof allowed)[number])
      : undefined;
    return this.envelope(
      await this.repository.search(query ?? '', normalizedType, this.userContext(request)),
      request,
    );
  }

  @Get('reports/overview')
  async report(
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(
      await this.repository.reportOverview(from, to, this.userContext(request)),
      request,
    );
  }

  @Get('audit')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER')
  async audit(
    @Query('module') module: string | undefined,
    @Query('action') action: string | undefined,
    @Query('actorId') actorId: string | undefined,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(await this.repository.listAudit({ module, action, actorId }), request);
  }

  private envelope<T>(data: T, request: RequestWithContext) {
    return {
      data,
      meta: { requestId: request.requestId ?? 'unknown', timestamp: new Date().toISOString() },
    };
  }

  private userContext(request: RequestWithContext) {
    const auth = (request as RequestWithContext & { auth?: { sub?: string; roles?: string[] } })
      .auth;
    return { userId: auth?.sub, roles: auth?.roles };
  }
}
