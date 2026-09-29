import { Body, Controller, Get, Inject, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { RequestWithContext } from '../../common/middleware/request-context.middleware';
import { AccessGuard } from '../auth/access.guard';
import { RequireRoles, RolesGuard } from '../auth/roles.guard';
import { CreateEmployeeDto, UpdateEmployeeDto } from './organization.dto';
import { ORGANIZATION_REPOSITORY } from './organization.repository';
import type { OrganizationRepository } from './organization.repository';

@Controller('users')
@UseGuards(AccessGuard, RolesGuard)
export class UsersController {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY) private readonly repository: OrganizationRepository,
  ) {}

  @Get()
  async list(@Req() request: RequestWithContext) {
    return this.envelope(await this.repository.listEmployees(), request);
  }

  @Post()
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER')
  async create(@Body() dto: CreateEmployeeDto, @Req() request: RequestWithContext) {
    return this.envelope(await this.repository.createEmployee(dto), request);
  }

  @Patch(':id')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(await this.repository.updateEmployee(id, dto), request);
  }

  @Post(':id/suspend')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER')
  async suspend(@Param('id') id: string, @Req() request: RequestWithContext) {
    await this.repository.updateEmployee(id, { status: 'SUSPENDED' });
    return this.envelope(
      { message: 'Đã đình chỉ tài khoản và thu hồi các phiên đang hoạt động.' },
      request,
    );
  }

  @Post(':id/reactivate')
  @RequireRoles('SYSTEM_ADMIN', 'MANAGING_PARTNER')
  async reactivate(@Param('id') id: string, @Req() request: RequestWithContext) {
    await this.repository.updateEmployee(id, { status: 'ACTIVE' });
    return this.envelope({ message: 'Đã kích hoạt lại tài khoản.' }, request);
  }

  private envelope<T>(data: T, request: RequestWithContext) {
    return {
      data,
      meta: { requestId: request.requestId ?? 'unknown', timestamp: new Date().toISOString() },
    };
  }
}
