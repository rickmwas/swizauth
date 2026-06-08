import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsArray,
  IsUrl,
  IsIn,
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
  @IsIn(['web', 'mobile', 'spa', 'machine_to_machine'])
  application_type: string;

  @IsArray()
  @IsOptional()
  @IsUrl({}, { each: true })
  redirect_urls?: string[];
}
