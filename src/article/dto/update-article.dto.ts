import { IsOptional, IsString } from 'class-validator';
import { Prisma } from 'generated/prisma';

export class UpdateArticleDto implements Prisma.ArticleUncheckedUpdateInput {
  @IsString()
  @IsOptional()
  contents?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  tagId?: string;

  @IsString()
  @IsOptional()
  authorId?: string;

  @IsString()
  @IsOptional()
  projectId?: string;

  // for type only
  image: Express.Multer.File;
}
