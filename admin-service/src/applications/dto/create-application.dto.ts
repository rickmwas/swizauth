import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsArray,
  IsUrl,
  IsIn,
  Matches,
} from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['web', 'mobile', 'spa', 'machine_to_machine', 'embedded_widget'])
  application_type: string;

  @IsArray()
  @IsOptional()
  @IsUrl({ require_tld: false }, { each: true, message: 'Each redirect URL must be a valid URL' })
  redirect_urls?: string[];

  @IsArray()
  @IsOptional()
  @IsUrl({ require_tld: false }, { each: true, message: 'Each allowed origin must be a valid URL' })
  allowed_origins?: string[];

  @IsArray()
  @IsOptional()
  @IsUrl({ require_tld: false }, { each: true, message: 'Each logout URL must be a valid URL' })
  logout_urls?: string[];

  @IsArray()
  @IsOptional()
  @IsUrl({ require_tld: false }, { each: true, message: 'Each web origin must be a valid URL' })
  web_origins?: string[];

  @IsString()
  @IsOptional()
  @IsUrl({ require_tld: false })
  logo_url?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Primary color must be a valid hex color' })
  primary_color?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Background color must be a valid hex color' })
  background_color?: string;
}
