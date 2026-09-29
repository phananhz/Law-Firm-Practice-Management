import { Body, Controller, Get, Inject, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { RequestWithContext } from '../../common/middleware/request-context.middleware';
import { AccessGuard } from '../auth/access.guard';
import { RequireRoles, RolesGuard } from '../auth/roles.guard';
import { CreateDepartmentDto, UpdateDepartmentDto } from './organization.dto';
import { ORGANIZATION_REPOSITORY } from './organization.repository';
import type { OrganizationRepository } from './organization.repository';

@Controller('organization')
@UseGuards(AccessGuard, RolesGuard)
export class OrganizationController {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY) private readonly repository: OrganizationRepository,
  ) {}

  @Get('overview')
  async overview(@Req() request: RequestWithContext) {
    return this.envelope(await this.repository.overview(), request);
  }

  @Get('departments')
  async departments(@Req() request: RequestWithContext) {
    return this.envelope(await this.repository.listDepartments(), request);
  }

  @Post('departments')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER')
  async createDepartment(@Body() dto: CreateDepartmentDto, @Req() request: RequestWithContext) {
    return this.envelope(await this.repository.createDepartment(dto), request);
  }

  @Patch('departments/:id')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER')
  async updateDepartment(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(await this.repository.updateDepartment(id, dto), request);
  }

  @Get('branches')
  async branches(@Req() request: RequestWithContext) {
    return this.envelope(await this.repository.listBranches(), request);
  }

  @Get('positions')
  async positions(@Req() request: RequestWithContext) {
    return this.envelope(await this.repository.listPositions(), request);
  }

  private envelope<T>(data: T, request: RequestWithContext) {
    return {
      data,
      meta: { requestId: request.requestId ?? 'unknown', timestamp: new Date().toISOString() },
    };
  }
}
