import { Controller, Get, Req, ServiceUnavailableException } from '@nestjs/common';
import type { RequestWithContext } from '../../common/middleware/request-context.middleware';
import { PrismaService } from '../../database/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getHealth(@Req() request: RequestWithContext) {
    return {
      data: { status: 'ok', service: 'api' },
      meta: { requestId: request.requestId ?? 'unknown', timestamp: new Date().toISOString() },
    };
  }

  @Get('ready')
  async getReadiness(@Req() request: RequestWithContext) {
    const persistence = await this.prisma.readiness();
    if (persistence.status === 'error') {
      throw new ServiceUnavailableException({
        code: 'PERSISTENCE_UNAVAILABLE',
        message: 'Không thể kết nối cơ sở dữ liệu.',
      });
    }
    return {
      data: { status: 'ok', service: 'api', persistence },
      meta: { requestId: request.requestId ?? 'unknown', timestamp: new Date().toISOString() },
    };
  }
}
