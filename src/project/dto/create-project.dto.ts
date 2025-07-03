import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Prisma } from 'generated/prisma';

export class CreateProjectDto implements Prisma.ProjectCreateInput {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  port: number;

  @IsString({ each: true })
  @IsArray()
  @Type(() => String)
  @IsNotEmpty()
  tag: string[];
}
