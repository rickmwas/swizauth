import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AuditQueryFilters {
  organizationId: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger('AuditService');

  constructor(private readonly prisma: PrismaService) {}

  async query(filters: AuditQueryFilters): Promise<{
    data: Array<Record<string, unknown>>;
    meta: { page: number; limit: number; total: number };
  }> {
    const where: Record<string, unknown> = {
      organization_id: filters.organizationId,
    };

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.userId) {
      where.user_id = filters.userId;
    }

    // Date range filter on created_at
    if (filters.startDate || filters.endDate) {
      const createdAt: Record<string, Date> = {};
      if (filters.startDate) {
        createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        createdAt.lte = new Date(filters.endDate);
      }
      where.created_at = createdAt;
    }

    const skip = (filters.page - 1) * filters.limit;

    const [logs, total] = await Promise.all([
      this.prisma.audit_logs.findMany({
        where,
        include: {
          users: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        skip,
        take: filters.limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.audit_logs.count({ where }),
    ]);

    const data = logs.map((log) => ({
      id: log.id,
      action: log.action,
      resource: log.resource,
      resource_id: log.resource_id,
      ip_address: log.ip_address,
      metadata: log.metadata,
      created_at: log.created_at,
      user: log.users
        ? {
            id: log.users.id,
            email: log.users.email,
            first_name: log.users.first_name,
            last_name: log.users.last_name,
          }
        : null,
    }));

    return {
      data,
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
      },
    };
  }
}
