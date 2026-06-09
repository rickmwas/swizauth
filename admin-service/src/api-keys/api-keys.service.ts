import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger('ApiKeysService');

  constructor(private readonly prisma: PrismaService) {}

  // ─── CREATE API KEY ────────────────────────────────────────

  async create(
    organizationId: string,
    dto: CreateApiKeyDto,
  ): Promise<{
    id: string;
    key: string;
    name: string;
    scopes: string[];
    expires_at: string | null;
  }> {
    const id = crypto.randomUUID();
    const now = new Date();

    // Generate a high-entropy key prefixed with sk_live_
    const rawKey = `sk_live_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const expiresAt = dto.expires_at ? new Date(dto.expires_at) : null;
    const scopes = dto.scopes ?? [];

    await this.prisma.api_keys.create({
      data: {
        id,
        organization_id: organizationId,
        name: dto.name,
        key_hash: keyHash,
        scopes: JSON.stringify(scopes),
        expires_at: expiresAt,
        revoked: false,
        created_at: now,
      },
    });

    this.logger.log(`API key "${dto.name}" created for org ${organizationId}`);

    // Return the plaintext key ONLY once — it is never stored
    return {
      id,
      key: rawKey,
      name: dto.name,
      scopes,
      expires_at: expiresAt?.toISOString() ?? null,
    };
  }

  // ─── LIST API KEYS ─────────────────────────────────────────

  async list(organizationId: string): Promise<Array<Record<string, unknown>>> {
    const keys = await this.prisma.api_keys.findMany({
      where: {
        organization_id: organizationId,
        revoked: false,
      },
      select: {
        id: true,
        name: true,
        scopes: true,
        expires_at: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      scopes:
        typeof k.scopes === 'string'
          ? (JSON.parse(k.scopes) as string[])
          : (k.scopes as unknown as string[]),
      expires_at: k.expires_at,
      created_at: k.created_at,
    }));
  }

  // ─── REVOKE API KEY ────────────────────────────────────────

  async revoke(
    organizationId: string,
    keyId: string,
  ): Promise<{ success: true }> {
    const key = await this.prisma.api_keys.findFirst({
      where: {
        id: keyId,
        organization_id: organizationId,
        revoked: false,
      },
    });

    if (!key) {
      throw new NotFoundException('API key not found or already revoked');
    }

    await this.prisma.api_keys.update({
      where: { id: keyId },
      data: { revoked: true },
    });

    this.logger.log(`API key ${keyId} revoked for org ${organizationId}`);

    return { success: true };
  }
}
