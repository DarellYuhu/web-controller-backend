import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Prisma } from 'generated/prisma';
import { Omit } from 'generated/prisma/runtime/library';

export class CreateArticleDto
  implements Omit<Prisma.ArticleUncheckedCreateInput, 'slug'>
{
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsNotEmpty()
  contents: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  authorName: string;

  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsString()
  @IsNotEmpty()
  authorId: string;

  @IsString()
  @IsNotEmpty()
  tagId: string;
}
