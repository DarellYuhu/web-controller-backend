import { Body, Controller, Get, Post } from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  create(@Body() payload: CreateArticleDto) {
    return this.articleService.create(payload);
  }

  @Get()
  findAll() {
    return this.articleService.findAll();
  }
}
