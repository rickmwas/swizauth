import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { RbacService } from './rbac.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@Controller('roles')
@UseGuards(AuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rbacService: RbacService) {}

  @Post()
  @Permissions('roles.create')
  createRole(
    @GetUser() user: AuthenticatedUser,
    @Body() dto: CreateRoleDto,
  ): Promise<{ id: string }> {
    return this.rbacService.createRole(user.organizationId, dto);
  }

  @Get()
  @Permissions('roles.read')
  listRoles(
    @GetUser() user: AuthenticatedUser,
  ): Promise<Array<Record<string, unknown>>> {
    return this.rbacService.listRoles(user.organizationId);
  }

  @Patch(':id')
  @Permissions('roles.update')
  updateRole(
    @GetUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<{ success: true }> {
    return this.rbacService.updateRole(user.organizationId, id, dto);
  }

  @Delete(':id')
  @Permissions('roles.delete')
  deleteRole(
    @GetUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{ success: true }> {
    return this.rbacService.deleteRole(user.organizationId, id);
  }
}

@Controller('permissions')
@UseGuards(AuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly rbacService: RbacService) {}

  @Get()
  @Permissions('roles.read')
  listPermissions(): Promise<Array<Record<string, unknown>>> {
    return this.rbacService.listPermissions();
  }

  @Post('assign')
  @Permissions('roles.update')
  assignPermissions(
    @GetUser() user: AuthenticatedUser,
    @Body() dto: AssignPermissionsDto,
  ): Promise<{ success: true; assigned: number }> {
    return this.rbacService.assignPermissions(user.organizationId, dto);
  }
}
