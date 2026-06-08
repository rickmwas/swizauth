import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';

export class InviteMemberDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsUUID()
  @IsNotEmpty()
  role_id: string;
}
