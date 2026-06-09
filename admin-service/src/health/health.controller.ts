import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

export interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
  version: string;
}

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth(): Promise<HealthResponse> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'admin-service',
      version: '1.0.0',
    };
  }

  @Get('ready')
  async getReadiness(): Promise<HealthResponse> {
    const isReady = await this.healthService.checkDatabaseConnection();
    
    if (!isReady) {
      throw new Error('Database connection failed');
    }

    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      service: 'admin-service',
      version: '1.0.0',
    };
  }
}