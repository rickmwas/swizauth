import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { PlanLimitsGuard } from '../common/guards/plan-limits.guard';

@Controller('applications')
@UseGuards(AuthGuard, PermissionsGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @UseGuards(PlanLimitsGuard)
  @Permissions('applications.create')
  create(
    @GetUser() user: AuthenticatedUser,
    @Body() dto: CreateApplicationDto,
  ): Promise<{ id: string; client_id: string; client_secret: string }> {
    return this.applicationsService.create(user.organizationId, dto);
  }

  @Get()
  @Permissions('applications.read')
  list(
    @GetUser() user: AuthenticatedUser,
  ): Promise<Array<Record<string, unknown>>> {
    return this.applicationsService.list(user.organizationId);
  }

  @Get(':id')
  @Permissions('applications.read')
  findOne(
    @GetUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<Record<string, unknown>> {
    return this.applicationsService.findOne(user.organizationId, id);
  }

  @Post(':id/rotate-secret')
  @HttpCode(200)
  @Permissions('applications.update')
  rotateSecret(
    @GetUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{ client_secret: string }> {
    return this.applicationsService.rotateSecret(user.organizationId, id);
  }
}
