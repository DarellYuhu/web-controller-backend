import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Prisma } from 'generated/prisma';
import { Omit } from 'generated/prisma/runtime/library';

export class CreateProjectDto
  implements Omit<Prisma.ProjectCreateInput, 'slug'>
{
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  port: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString({ each: true })
  @IsNotEmpty()
  @IsArray()
  @Type(() => String)
  tagIds: string[];
}
