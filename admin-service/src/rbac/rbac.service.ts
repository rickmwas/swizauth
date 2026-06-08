import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import * as crypto from 'crypto';

@Injectable()
export class RbacService {
  private readonly logger = new Logger('RbacService');

  constructor(private readonly prisma: PrismaService) {}

  // ─── ROLES CRUD ────────────────────────────────────────────

  async createRole(
    organizationId: string,
    dto: CreateRoleDto,
  ): Promise<{ id: string }> {
    const id = crypto.randomUUID();
    const now = new Date();

    try {
      const role = await this.prisma.roles.create({
        data: {
          id,
          organization_id: organizationId,
          name: dto.name,
          description: dto.description ?? null,
          is_system: false,
          created_at: now,
          updated_at: now,
        },
      });

      return { id: role.id };
    } catch (err: unknown) {
      if ((err as Record<string, unknown>)?.code === 'P2002') {
        throw new ConflictException(
          `A role named "${dto.name}" already exists in this organization`,
        );
      }
      throw err;
    }
  }

  async listRoles(
    organizationId: string,
  ): Promise<Array<Record<string, unknown>>> {
    const roles = await this.prisma.roles.findMany({
      where: { organization_id: organizationId },
      include: {
        role_permissions: {
          include: {
            permissions: {
              select: { id: true, name: true, module: true },
            },
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      is_system: r.is_system,
      created_at: r.created_at,
      permissions: r.role_permissions.map((rp) => ({
        id: rp.permissions.id,
        name: rp.permissions.name,
        module: rp.permissions.module,
      })),
    }));
  }

  async updateRole(
    organizationId: string,
    roleId: string,
    dto: UpdateRoleDto,
  ): Promise<{ success: true }> {
    const role = await this.prisma.roles.findFirst({
      where: { id: roleId, organization_id: organizationId },
    });

    if (!role) {
      throw new NotFoundException('Role not found in this organization');
    }

    if (role.is_system) {
      throw new BadRequestException('System roles cannot be modified');
    }

    const data: Record<string, unknown> = { updated_at: new Date() };
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;

    try {
      await this.prisma.roles.update({
        where: { id: roleId },
        data,
      });
    } catch (err: unknown) {
      if ((err as Record<string, unknown>)?.code === 'P2002') {
        throw new ConflictException(
          `A role named "${dto.name}" already exists in this organization`,
        );
      }
      throw err;
    }

    return { success: true };
  }

  async deleteRole(
    organizationId: string,
    roleId: string,
  ): Promise<{ success: true }> {
    const role = await this.prisma.roles.findFirst({
      where: { id: roleId, organization_id: organizationId },
    });

    if (!role) {
      throw new NotFoundException('Role not found in this organization');
    }

    if (role.is_system) {
      throw new BadRequestException('System roles cannot be deleted');
    }

    // Prisma cascading deletes will clean up role_permissions and user_roles
    await this.prisma.roles.delete({ where: { id: roleId } });

    return { success: true };
  }

  // ─── PERMISSIONS ───────────────────────────────────────────

  async listPermissions(): Promise<Array<Record<string, unknown>>> {
    const perms = await this.prisma.permissions.findMany({
      orderBy: [{ module: 'asc' }, { name: 'asc' }],
    });

    return perms.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      module: p.module,
    }));
  }

  async assignPermissions(
    organizationId: string,
    dto: AssignPermissionsDto,
  ): Promise<{ success: true; assigned: number }> {
    // Verify role belongs to this org
    const role = await this.prisma.roles.findFirst({
      where: { id: dto.role_id, organization_id: organizationId },
    });

    if (!role) {
      throw new NotFoundException('Role not found in this organization');
    }

    if (role.is_system) {
      throw new BadRequestException(
        'System role permissions cannot be modified',
      );
    }

    // Verify all permission IDs exist
    const permissions = await this.prisma.permissions.findMany({
      where: { id: { in: dto.permission_ids } },
      select: { id: true },
    });

    if (permissions.length !== dto.permission_ids.length) {
      throw new BadRequestException('One or more permission IDs are invalid');
    }

    // Remove existing bindings and replace with the new set (full replacement strategy)
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.role_permissions.deleteMany({
        where: { role_id: dto.role_id },
      }),
      this.prisma.role_permissions.createMany({
        data: dto.permission_ids.map((permId) => ({
          id: crypto.randomUUID(),
          role_id: dto.role_id,
          permission_id: permId,
          created_at: now,
        })),
      }),
    ]);

    this.logger.log(
      `Assigned ${dto.permission_ids.length} permissions to role ${dto.role_id}`,
    );

    return { success: true, assigned: dto.permission_ids.length };
  }
}
