import { Body, Controller, Get, Post } from '@nestjs/common';
import { TagService } from './tag.service';
import { MetadataCreateDto } from 'src/dtos/metadata-create-dto';

@Controller('tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post()
  create(@Body() payload: MetadataCreateDto) {
    return this.tagService.create(payload.data);
  }

  @Get()
  findAll() {
    return this.tagService.findAll();
  }
}
