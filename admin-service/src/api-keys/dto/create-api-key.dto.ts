import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsArray,
  IsDateString,
} from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  scopes?: string[];

  @IsDateString()
  @IsOptional()
  expires_at?: string;
}
