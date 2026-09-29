import { Test } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const request = { requestId: 'test-request' } as never;

  it('returns an API health envelope', async () => {
    const testingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: { readiness: jest.fn().mockResolvedValue({ mode: 'mock', status: 'skipped' }) },
        },
      ],
    }).compile();
    const controller = testingModule.get(HealthController);
    const response = controller.getHealth(request);

    expect(response.data).toEqual({ status: 'ok', service: 'api' });
    expect(response.meta.requestId).toBe('test-request');
  });

  it('reports mock persistence as intentionally skipped', async () => {
    const testingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: { readiness: jest.fn().mockResolvedValue({ mode: 'mock', status: 'skipped' }) },
        },
      ],
    }).compile();

    const response = await testingModule.get(HealthController).getReadiness(request);
    expect(response.data.persistence).toEqual({ mode: 'mock', status: 'skipped' });
  });

  it('fails readiness when the Prisma connection is unavailable', async () => {
    const testingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: { readiness: jest.fn().mockResolvedValue({ mode: 'prisma', status: 'error' }) },
        },
      ],
    }).compile();

    await expect(testingModule.get(HealthController).getReadiness(request)).rejects.toMatchObject({
      status: 503,
    });
  });
});
