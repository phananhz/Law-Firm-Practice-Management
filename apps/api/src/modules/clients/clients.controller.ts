import { Body, Controller, Get, Inject, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { RequestWithContext } from '../../common/middleware/request-context.middleware';
import { AccessGuard } from '../auth/access.guard';
import {
  ChangeClientStatusDto,
  CreateClientDto,
  CreateContactDto,
  UpdateClientDto,
} from './clients.dto';
import { CLIENTS_REPOSITORY } from './clients.repository';
import type { ClientsRepository } from './clients.repository';

@Controller('clients')
@UseGuards(AccessGuard)
export class ClientsController {
  constructor(@Inject(CLIENTS_REPOSITORY) private readonly repository: ClientsRepository) {}

  @Get()
  async list(@Req() request: RequestWithContext) {
    return this.envelope(await this.repository.list(), request);
  }

  @Get(':id')
  async find(@Param('id') id: string, @Req() request: RequestWithContext) {
    return this.envelope(await this.repository.find(id), request);
  }

  @Post()
  async create(@Body() dto: CreateClientDto, @Req() request: RequestWithContext) {
    return this.envelope(await this.repository.create(dto), request);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(await this.repository.update(id, dto), request);
  }

  @Post(':id/status')
  async changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeClientStatusDto,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(
      {
        message: 'Đã cập nhật trạng thái khách hàng.',
        client: await this.repository.changeStatus(id, dto.status),
      },
      request,
    );
  }

  @Get(':id/contacts')
  async contacts(@Param('id') id: string, @Req() request: RequestWithContext) {
    return this.envelope(await this.repository.contacts(id), request);
  }

  @Post(':id/contacts')
  async addContact(
    @Param('id') id: string,
    @Body() dto: CreateContactDto,
    @Req() request: RequestWithContext,
  ) {
    return this.envelope(await this.repository.addContact(id, dto), request);
  }

  @Get(':id/relations')
  async relations(@Param('id') id: string, @Req() request: RequestWithContext) {
    return this.envelope(await this.repository.relations(id), request);
  }

  private envelope<T>(data: T, request: RequestWithContext) {
    return {
      data,
      meta: { requestId: request.requestId ?? 'unknown', timestamp: new Date().toISOString() },
    };
  }
}
