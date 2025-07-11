import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Role } from 'generated/prisma';

export class SignUpDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;
}
