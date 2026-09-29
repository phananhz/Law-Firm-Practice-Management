import { Body, Controller, Get, Headers, Post, Query, UnauthorizedException } from '@nestjs/common';
import type { QueueEvent } from './queue.types';
import { QueueService } from './queue.service';

@Controller('internal/queues')
export class QueueController {
  constructor(private readonly queue: QueueService) {}

  @Post('process')
  async process(@Headers('x-queue-secret') secret: string | undefined, @Body() event: QueueEvent) {
    this.assertSecret(secret);
    return { data: await this.queue.process(event) };
  }

  @Get('reminders')
  async reminders(
    @Headers('x-queue-secret') secret: string | undefined,
    @Query('date') date?: string,
  ) {
    this.assertSecret(secret);
    return { data: await this.queue.reminderEvents(date) };
  }

  private assertSecret(secret: string | undefined): void {
    if (!this.queue.isInternalSecret(secret))
      throw new UnauthorizedException('Queue consumer không hợp lệ.');
  }
}
