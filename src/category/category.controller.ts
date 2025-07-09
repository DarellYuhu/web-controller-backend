import { Controller, Get, Post, Body } from '@nestjs/common';
import { CategoryService } from './category.service';
import { MetadataCreateDto } from 'src/dtos/metadata-create-dto';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  create(@Body() payload: MetadataCreateDto) {
    return this.categoryService.create(payload.data);
  }

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }
}
