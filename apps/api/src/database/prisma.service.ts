import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { getPersistenceMode } from './persistence-mode';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private connected = false;

  constructor(private readonly config: ConfigService) {
    super();
  }

  get mode() {
    return getPersistenceMode(this.config.get<string>('PERSISTENCE_MODE'));
  }

  get isEnabled() {
    return this.mode === 'prisma';
  }

  async onModuleInit(): Promise<void> {
    if (!this.isEnabled) return;
    await this.$connect();
    this.connected = true;
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.connected) return;
    await this.$disconnect();
    this.connected = false;
  }

  async readiness(): Promise<{ mode: 'mock' | 'prisma'; status: 'ready' | 'skipped' | 'error' }> {
    if (!this.isEnabled) return { mode: 'mock', status: 'skipped' };
    try {
      await this.$queryRaw`SELECT 1`;
      return { mode: 'prisma', status: 'ready' };
    } catch {
      return { mode: 'prisma', status: 'error' };
    }
  }
}
