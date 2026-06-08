import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import * as crypto from 'crypto';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger('ApplicationsService');

  constructor(private readonly prisma: PrismaService) {}

  // ─── CREATE APPLICATION ────────────────────────────────────

  async create(
    organizationId: string,
    dto: CreateApplicationDto,
  ): Promise<{
    id: string;
    client_id: string;
    client_secret: string;
  }> {
    const id = crypto.randomUUID();
    const now = new Date();

    // Generate client credentials
    const clientId = `swiz_${crypto.randomBytes(16).toString('hex')}`;
    const clientSecret = `secret_${crypto.randomBytes(32).toString('hex')}`;
    const clientSecretHash = crypto
      .createHash('sha256')
      .update(clientSecret)
      .digest('hex');

    await this.prisma.applications.create({
      data: {
        id,
        organization_id: organizationId,
        name: dto.name,
        description: dto.description ?? null,
        client_id: clientId,
        client_secret_hash: clientSecretHash,
        application_type: dto.application_type,
        redirect_urls: JSON.stringify(dto.redirect_urls ?? []),
        status: 'active',
        created_at: now,
        updated_at: now,
      },
    });

    this.logger.log(
      `Application "${dto.name}" created for org ${organizationId} with client_id ${clientId}`,
    );

    // Return the plaintext secret only once
    return {
      id,
      client_id: clientId,
      client_secret: clientSecret,
    };
  }

  // ─── LIST APPLICATIONS ────────────────────────────────────

  async list(organizationId: string): Promise<Array<Record<string, unknown>>> {
    const apps = await this.prisma.applications.findMany({
      where: { organization_id: organizationId },
      select: {
        id: true,
        name: true,
        description: true,
        client_id: true,
        application_type: true,
        redirect_urls: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return apps.map((a) => ({
      ...a,
      redirect_urls:
        typeof a.redirect_urls === 'string'
          ? (JSON.parse(a.redirect_urls) as string[])
          : (a.redirect_urls as unknown as string[]),
    }));
  }

  // ─── GET APPLICATION ───────────────────────────────────────

  async findOne(
    organizationId: string,
    appId: string,
  ): Promise<Record<string, unknown>> {
    const app = await this.prisma.applications.findFirst({
      where: { id: appId, organization_id: organizationId },
      select: {
        id: true,
        name: true,
        description: true,
        client_id: true,
        application_type: true,
        redirect_urls: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!app) {
      throw new NotFoundException('Application not found');
    }

    return {
      ...app,
      redirect_urls:
        typeof app.redirect_urls === 'string'
          ? (JSON.parse(app.redirect_urls) as string[])
          : app.redirect_urls,
    };
  }

  // ─── ROTATE SECRET ─────────────────────────────────────────

  async rotateSecret(
    organizationId: string,
    appId: string,
  ): Promise<{ client_secret: string }> {
    const app = await this.prisma.applications.findFirst({
      where: { id: appId, organization_id: organizationId },
    });

    if (!app) {
      throw new NotFoundException('Application not found');
    }

    const newSecret = `secret_${crypto.randomBytes(32).toString('hex')}`;
    const newHash = crypto.createHash('sha256').update(newSecret).digest('hex');

    await this.prisma.applications.update({
      where: { id: appId },
      data: {
        client_secret_hash: newHash,
        updated_at: new Date(),
      },
    });

    this.logger.log(
      `Secret rotated for application ${appId} in org ${organizationId}`,
    );

    return { client_secret: newSecret };
  }
}
