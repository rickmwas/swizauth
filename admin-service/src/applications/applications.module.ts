import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Module({
  controllers: [ApplicationsController],
  providers: [ApplicationsService, AuthGuard, PermissionsGuard],
})
export class ApplicationsModule {}
