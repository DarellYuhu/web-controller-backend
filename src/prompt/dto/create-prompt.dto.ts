import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class PromptData {
  @IsNotEmpty()
  @IsString()
  text: string;
}
export class CreatePromptDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromptData)
  data: PromptData[];
}
