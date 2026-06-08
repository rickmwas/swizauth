import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUrl,
  IsIn,
} from 'class-validator';

export class UpdateOrganizationDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  logo_url?: string;

  @IsString()
  @IsOptional()
  @IsIn(['active', 'suspended', 'pending'])
  status?: string;

  @IsString()
  @IsOptional()
  @IsIn(['free', 'starter', 'business', 'enterprise'])
  plan?: string;
}
