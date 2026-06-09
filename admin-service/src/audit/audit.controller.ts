import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@Controller('audit')
@UseGuards(AuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * GET /api/v1/audit
   * Paginated audit log query with optional filters:
   *  - action: filter by action type (e.g. "user.login")
   *  - user_id: filter by specific user
   *  - start_date: ISO-8601 date lower bound
   *  - end_date: ISO-8601 date upper bound
   *  - page: page number (default 1)
   *  - limit: results per page (default 20)
   */
  @Get()
  @Permissions('audit_logs.read')
  query(
    @GetUser() user: AuthenticatedUser,
    @Query('action') action?: string,
    @Query('user_id') userId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ): Promise<{
    data: Array<Record<string, unknown>>;
    meta: { page: number; limit: number; total: number };
  }> {
    return this.auditService.query({
      organizationId: user.organizationId,
      action,
      userId,
      startDate,
      endDate,
      page: page ?? 1,
      limit: limit ?? 20,
    });
  }
}
