import { IsOptional, IsString } from 'class-validator';

export class UpdateArticleDto {
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

  // for type only
  image?: Express.Multer.File;
}
