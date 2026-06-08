import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@Controller('api-keys')
@UseGuards(AuthGuard, PermissionsGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @Permissions('api_keys.create')
  create(
    @GetUser() user: AuthenticatedUser,
    @Body() dto: CreateApiKeyDto,
  ): Promise<{
    id: string;
    key: string;
    name: string;
    scopes: string[];
    expires_at: string | null;
  }> {
    return this.apiKeysService.create(user.organizationId, dto);
  }

  @Get()
  @Permissions('api_keys.read')
  list(
    @GetUser() user: AuthenticatedUser,
  ): Promise<Array<Record<string, unknown>>> {
    return this.apiKeysService.list(user.organizationId);
  }

  @Delete(':id')
  @Permissions('api_keys.delete')
  revoke(
    @GetUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{ success: true }> {
    return this.apiKeysService.revoke(user.organizationId, id);
  }
}
