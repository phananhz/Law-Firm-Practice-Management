import { Body, Controller, Get, Inject, Param, Put, Req, UseGuards } from '@nestjs/common';
import type { RequestWithContext } from '../../common/middleware/request-context.middleware';
import { AccessGuard } from '../auth/access.guard';
import { RequireRoles, RolesGuard } from '../auth/roles.guard';
import { UpdateRolePermissionsDto } from './organization.dto';
import { ORGANIZATION_REPOSITORY } from './organization.repository';
import type { OrganizationRepository } from './organization.repository';

@Controller('authorization')
@UseGuards(AccessGuard, RolesGuard)
export class AuthorizationController {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY) private readonly repository: OrganizationRepository,
  ) {}

  @Get('roles')
  async roles(@Req() request: RequestWithContext) {
    return this.envelope(await this.repository.listRoles(), request);
  }

  @Get('permissions')
  async permissions(@Req() request: RequestWithContext) {
    return this.envelope(await this.repository.listPermissions(), request);
  }

  @Put('roles/:id/permissions')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER')
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionsDto,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(await this.repository.updateRolePermissions(id, dto.permissions), request);
  }

  private envelope<T>(data: T, request: RequestWithContext) {
    return {
      data,
      meta: { requestId: request.requestId ?? 'unknown', timestamp: new Date().toISOString() },
    };
  }
}
