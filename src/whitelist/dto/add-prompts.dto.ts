import { IsArray, IsString } from 'class-validator';

export class AddPromptsDto {
  @IsArray()
  @IsString({ each: true })
  data: string[];
}
