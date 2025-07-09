import { Controller, Get, Post, Body } from '@nestjs/common';
import { AuthorService } from './author.service';
import { MetadataCreateDto } from 'src/dtos/metadata-create-dto';

@Controller('authors')
export class AuthorController {
  constructor(private readonly authorService: AuthorService) {}

  @Post()
  create(@Body() payload: MetadataCreateDto) {
    return this.authorService.create(payload.data);
  }

  @Get()
  findAll() {
    return this.authorService.findAll();
  }
}
