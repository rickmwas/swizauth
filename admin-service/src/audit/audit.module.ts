import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Module({
  controllers: [AuditController],
  providers: [AuditService, AuthGuard, PermissionsGuard],
})
export class AuditModule {}
