import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  private readonly logger = new Logger('RedisService');

  constructor(configService: ConfigService) {
    const url =
      configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    super(url);

    this.on('connect', () => {
      this.logger.log('Successfully connected to Redis');
    });

    this.on('error', (err) => {
      this.logger.error('Redis connection error:', err);
    });
  }

  onModuleDestroy() {
    this.disconnect();
  }
}
