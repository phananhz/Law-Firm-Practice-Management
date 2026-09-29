import type { IncomingMessage, ServerResponse } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import { createApp } from '../src/main';

let applicationPromise: Promise<INestApplication> | undefined;

async function getApplication(): Promise<INestApplication> {
  applicationPromise ??= createApp().then(async (app) => {
    await app.init();
    return app;
  });
  return applicationPromise;
}

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<unknown> {
  const app = await getApplication();
  return app.getHttpAdapter().getInstance()(request, response);
}
