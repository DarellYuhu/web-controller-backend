import { IsArray, IsString } from 'class-validator';

export class PublishArticleDto {
  @IsArray()
  @IsString({ each: true })
  data: string[];
}
