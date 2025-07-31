import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { SectionType } from 'generated/prisma';

export class NewSection {
  @IsString()
  @IsNotEmpty()
  articleId: string;

  @IsEnum(SectionType)
  @IsNotEmpty()
  type: SectionType;
}

export class TemplateSchema {
  @IsNumber()
  @IsNotEmpty()
  header: number;

  @IsNumber()
  @IsNotEmpty()
  highlight: number;

  @IsNumber()
  @IsNotEmpty()
  topPicks: number;
}

export class UpdateProjectDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NewSection)
  @IsOptional()
  newSection?: NewSection;

  @IsString()
  @IsOptional()
  name?: string;

  @Type(() => TemplateSchema)
  @ValidateNested()
  @IsOptional()
  template?: TemplateSchema;

  // just for type
  icon?: Express.Multer.File;
  logo?: Express.Multer.File;
}
