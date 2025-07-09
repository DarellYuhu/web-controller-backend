import { Type } from 'class-transformer';
import { IsArray, IsString } from 'class-validator';

export class MetadataCreateDto {
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  data: string[];
}
