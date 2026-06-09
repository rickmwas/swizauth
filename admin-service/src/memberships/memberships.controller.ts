import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  /**
   * POST /api/v1/memberships/invite
   * Creates an invitation token for a new member to join the org.
   */
  @Post('invite')
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('users.create')
  invite(
    @GetUser() user: AuthenticatedUser,
    @Body() dto: InviteMemberDto,
  ): Promise<{ success: true; invitation_token: string }> {
    return this.membershipsService.invite(user.organizationId, dto);
  }

  /**
   * POST /api/v1/memberships/accept
   * Accepts an invitation — registers the user and assigns the invited role.
   * This endpoint is public (no auth guard) since the user doesn't exist yet.
   */
  @Post('accept')
  accept(
    @Body() dto: AcceptInviteDto,
  ): Promise<{ success: true; user_id: string }> {
    return this.membershipsService.accept(dto);
  }

  /**
   * GET /api/v1/memberships
   * Lists all active members in the authenticated user's organization.
   */
  @Get()
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('users.read')
  listMembers(
    @GetUser() user: AuthenticatedUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<{
    data: Array<Record<string, unknown>>;
    meta: { page: number; limit: number; total: number };
  }> {
    return this.membershipsService.listMembers(
      user.organizationId,
      page,
      limit,
    );
  }

  /**
   * DELETE /api/v1/memberships/:userId
   * Removes a member from the organization (soft-delete + session blacklisting).
   */
  @Delete(':userId')
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('users.delete')
  removeMember(
    @GetUser() user: AuthenticatedUser,
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ): Promise<{ success: true }> {
    return this.membershipsService.removeMember(user.organizationId, userId);
  }
}
