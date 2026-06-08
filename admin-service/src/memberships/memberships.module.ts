import { Module } from '@nestjs/common';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Module({
  controllers: [MembershipsController],
  providers: [MembershipsService, AuthGuard, PermissionsGuard],
})
export class MembershipsModule {}
