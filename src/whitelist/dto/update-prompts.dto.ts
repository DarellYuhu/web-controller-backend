import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

export class UpdatePromptsData {
  @IsString()
  @IsNotEmpty()
  promptId: string;

  @IsNumber()
  @IsNotEmpty()
  score: number;
}
export class UpdatePromptsDto {
  @Type(() => UpdatePromptsData)
  @ValidateNested({ each: true })
  @IsArray()
  data: UpdatePromptsData[];
}
