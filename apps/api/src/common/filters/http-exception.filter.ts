import { Catch, type ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Request, Response } from 'express';
import type { RequestWithContext } from '../middleware/request-context.middleware';

@Catch()
export class HttpExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<RequestWithContext & Request>();
    const requestId = request.requestId ?? 'unknown';
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = isHttpException ? exception.getResponse() : undefined;
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? body.message
        : 'An unexpected error occurred.';

    if (status >= 500) {
      this.logger.error(
        `Unhandled request error [${requestId}]`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }
    response.status(status).json({
      error: {
        code:
          status === 400
            ? 'VALIDATION_FAILED'
            : status === 500
              ? 'INTERNAL_SERVER_ERROR'
              : 'REQUEST_FAILED',
        message,
        details: [],
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
