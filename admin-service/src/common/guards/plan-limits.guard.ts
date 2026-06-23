import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlanLimitsGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.organizationId) {
      return true;
    }

    const orgId = user.organizationId;
    const org = await this.prisma.organizations.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      throw new ForbiddenException('Organization not found');
    }

    const plan = (org.plan || 'FREE').toUpperCase();

    if (plan === 'PROFESSIONAL' || plan === 'ENTERPRISE') {
      return true;
    }

    const path = request.path || '';
    const method = request.method;

    if (method === 'POST') {
      if (path.includes('/applications')) {
        const appCount = await this.prisma.applications.count({
          where: { organization_id: orgId },
        });

        const limit = plan === 'STARTER' ? 5 : 1;
        if (appCount >= limit) {
          throw new ForbiddenException(
            `Your organization is on the ${plan} plan and has reached the limit of ${limit} applications. Please upgrade your plan.`,
          );
        }
      }

      if (path.includes('/memberships/invite')) {
        const memberCount = await this.prisma.users.count({
          where: {
            organization_id: orgId,
            deleted_at: null,
          },
        });

        const limit = plan === 'STARTER' ? 50 : 5;
        if (memberCount >= limit) {
          throw new ForbiddenException(
            `Your organization is on the ${plan} plan and has reached the limit of ${limit} members. Please upgrade your plan.`,
          );
        }
      }
    }

    return true;
  }
}
