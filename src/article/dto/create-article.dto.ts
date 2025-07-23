import { IsNotEmpty, IsString } from 'class-validator';
import { Prisma } from 'generated/prisma';
import { Omit } from 'generated/prisma/runtime/library';

export class CreateArticleDto
  implements Omit<Prisma.ArticleUncheckedCreateInput, 'slug'>
{
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  contents: string;

  @IsString()
  @IsNotEmpty()
  authorId: string;

  @IsString()
  @IsNotEmpty()
  tagId: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  // additional for type checking
  image: Express.Multer.File;
}
