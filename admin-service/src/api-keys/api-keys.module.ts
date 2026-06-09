import { Module } from '@nestjs/common';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Module({
  controllers: [ApiKeysController],
  providers: [ApiKeysService, AuthGuard, PermissionsGuard],
})
export class ApiKeysModule {}
