import { IsUUID, IsNotEmpty, IsArray, ArrayMinSize } from 'class-validator';

export class AssignPermissionsDto {
  @IsUUID()
  @IsNotEmpty()
  role_id: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  permission_ids: string[];
}
