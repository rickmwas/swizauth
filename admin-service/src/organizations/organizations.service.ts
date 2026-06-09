import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async create(dto: CreateOrganizationDto) {
    let slug = this.slugify(dto.name);

    // Check if slug is unique, else append a random 4-character hex
    const existing = await this.prisma.organizations.findUnique({
      where: { slug },
    });
    if (existing) {
      slug = `${slug}-${crypto.randomBytes(2).toString('hex')}`;
    }

    const id = crypto.randomUUID();
    const now = new Date();

    const org = await this.prisma.organizations.create({
      data: {
        id,
        name: dto.name,
        slug,
        logo_url: dto.logo_url ?? null,
        status: 'active',
        plan: 'free',
        created_at: now,
        updated_at: now,
      },
    });

    return { id: org.id };
  }

  async findOne(id: string) {
    const org = await this.prisma.organizations.findUnique({
      where: { id },
    });

    if (!org) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    // Check if it exists
    await this.findOne(id);

    const data: Prisma.organizationsUpdateInput = {
      updated_at: new Date(),
    };

    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.logo_url !== undefined) {
      data.logo_url = dto.logo_url;
    }
    if (dto.status !== undefined) {
      data.status = dto.status;
    }
    if (dto.plan !== undefined) {
      data.plan = dto.plan;
    }

    await this.prisma.organizations.update({
      where: { id },
      data,
    });

    return { success: true };
  }

  async remove(id: string) {
    // Check if it exists
    await this.findOne(id);

    await this.prisma.organizations.delete({
      where: { id },
    });

    return { success: true };
  }
}
