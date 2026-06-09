import { Module } from '@nestjs/common';
import { RolesController, PermissionsController } from './rbac.controller';
import { RbacService } from './rbac.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Module({
  controllers: [RolesController, PermissionsController],
  providers: [RbacService, AuthGuard, PermissionsGuard],
})
export class RbacModule {}
