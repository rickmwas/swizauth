import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import * as crypto from 'crypto';

interface InvitationPayload {
  email: string;
  organizationId: string;
  roleId: string;
}

interface AuthServiceErrorResponse {
  error?: {
    message?: string;
  };
}

interface AuthServiceRegisterResponse {
  user_id?: string;
}

@Injectable()
export class MembershipsService {
  private readonly logger = new Logger('MembershipsService');
  private readonly authServiceUrl: string;
  private readonly internalApiSecret: string;

  /** Invitation tokens live for 7 days */
  private static readonly INVITATION_TTL_SECONDS = 7 * 24 * 60 * 60;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.authServiceUrl =
      this.configService.get<string>('AUTH_SERVICE_URL') ||
      'http://localhost:8080';
    this.internalApiSecret =
      this.configService.get<string>('INTERNAL_API_SECRET') || '';
  }

  // ─── INVITE ────────────────────────────────────────────────

  async invite(
    organizationId: string,
    dto: InviteMemberDto,
  ): Promise<{ success: true; invitation_token: string }> {
    // Validate the role exists and belongs to this organization
    const role = await this.prisma.roles.findFirst({
      where: { id: dto.role_id, organization_id: organizationId },
    });
    if (!role) {
      throw new BadRequestException('Role does not exist in this organization');
    }

    // Prevent duplicate active members (non-soft-deleted) with the same email
    const existingUser = await this.prisma.users.findFirst({
      where: {
        organization_id: organizationId,
        email: dto.email,
        deleted_at: null,
      },
    });
    if (existingUser) {
      throw new ConflictException(
        'A member with this email already exists in the organization',
      );
    }

    // Generate a high-entropy invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const redisKey = `invitation:${token}`;

    const payload: InvitationPayload = {
      email: dto.email,
      organizationId,
      roleId: dto.role_id,
    };

    await this.redis.set(
      redisKey,
      JSON.stringify(payload),
      'EX',
      MembershipsService.INVITATION_TTL_SECONDS,
    );

    this.logger.log(
      `Invitation created for ${dto.email} in org ${organizationId} with role ${dto.role_id}`,
    );

    return { success: true, invitation_token: token };
  }

  // ─── ACCEPT ────────────────────────────────────────────────

  async accept(
    dto: AcceptInviteDto,
  ): Promise<{ success: true; user_id: string }> {
    const redisKey = `invitation:${dto.token}`;
    const raw = await this.redis.get(redisKey);

    if (!raw) {
      throw new BadRequestException(
        'Invitation token is invalid or has expired',
      );
    }

    const invitation = JSON.parse(raw) as InvitationPayload;

    // Register user through the Go auth-service
    const registerResponse = await fetch(
      `${this.authServiceUrl}/api/v1/auth/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: invitation.email,
          username: dto.username,
          password: dto.password,
          first_name: dto.first_name,
          last_name: dto.last_name,
          organization_id: invitation.organizationId,
        }),
      },
    );

    if (!registerResponse.ok) {
      const errorData = (await registerResponse
        .json()
        .catch(() => ({}))) as AuthServiceErrorResponse;
      const msg =
        errorData?.error?.message || 'Registration via auth service failed';
      throw new BadRequestException(msg);
    }

    const registerData =
      (await registerResponse.json()) as AuthServiceRegisterResponse;
    const userId = registerData.user_id;

    if (!userId) {
      throw new InternalServerErrorException(
        'Auth service did not return a user ID',
      );
    }

    // Assign the invited role to the new user
    const userRoleId = crypto.randomUUID();
    const now = new Date();

    await this.prisma.user_roles.create({
      data: {
        id: userRoleId,
        user_id: userId,
        role_id: invitation.roleId,
        created_at: now,
      },
    });

    // Consume the invitation token
    await this.redis.del(redisKey);

    this.logger.log(
      `Invitation accepted: user ${userId} joined org ${invitation.organizationId} with role ${invitation.roleId}`,
    );

    return { success: true, user_id: userId };
  }

  // ─── LIST MEMBERS ──────────────────────────────────────────

  async listMembers(
    organizationId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Array<Record<string, unknown>>;
    meta: { page: number; limit: number; total: number };
  }> {
    const skip = (page - 1) * limit;

    const [members, total] = await Promise.all([
      this.prisma.users.findMany({
        where: {
          organization_id: organizationId,
          deleted_at: null,
        },
        select: {
          id: true,
          email: true,
          username: true,
          first_name: true,
          last_name: true,
          status: true,
          last_login_at: true,
          created_at: true,
          user_roles: {
            select: {
              roles: {
                select: { id: true, name: true },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.users.count({
        where: {
          organization_id: organizationId,
          deleted_at: null,
        },
      }),
    ]);

    const data = members.map((m) => ({
      id: m.id,
      email: m.email,
      username: m.username,
      first_name: m.first_name,
      last_name: m.last_name,
      status: m.status,
      last_login_at: m.last_login_at,
      created_at: m.created_at,
      roles: m.user_roles.map((ur) => ({
        id: ur.roles.id,
        name: ur.roles.name,
      })),
    }));

    return { data, meta: { page, limit, total } };
  }

  // ─── REMOVE MEMBER ─────────────────────────────────────────

  async removeMember(
    organizationId: string,
    userId: string,
  ): Promise<{ success: true }> {
    const user = await this.prisma.users.findFirst({
      where: {
        id: userId,
        organization_id: organizationId,
        deleted_at: null,
      },
    });

    if (!user) {
      throw new NotFoundException('Member not found in this organization');
    }

    // Soft-delete the user
    await this.prisma.users.update({
      where: { id: userId },
      data: { deleted_at: new Date(), status: 'disabled' },
    });

    // Revoke all active sessions and blacklist them in Redis
    const activeSessions = await this.prisma.sessions.findMany({
      where: {
        user_id: userId,
        revoked: false,
      },
      select: { id: true },
    });

    if (activeSessions.length > 0) {
      // Mark sessions as revoked in the database
      await this.prisma.sessions.updateMany({
        where: {
          user_id: userId,
          revoked: false,
        },
        data: { revoked: true },
      });

      // Blacklist each session in Redis so the Go auth-service rejects them immediately
      const pipeline = this.redis.pipeline();
      for (const session of activeSessions) {
        pipeline.set(
          `session:revoked:${session.id}`,
          '1',
          'EX',
          24 * 60 * 60, // 24h TTL — longer than any access token lifetime
        );
      }
      await pipeline.exec();
    }

    this.logger.log(
      `Member ${userId} removed from org ${organizationId}. ${activeSessions.length} sessions revoked.`,
    );

    return { success: true };
  }
}
