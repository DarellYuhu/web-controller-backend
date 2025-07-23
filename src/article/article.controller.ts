import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { PublishArticleDto } from './dto/publish-article.dto';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  create(@Body() payload: CreateArticleDto) {
    return this.articleService.create(payload);
  }

  @Get()
  findAll(
    @Query('project_id') projectId: string,
    @Query('section_type') sectionType: string,
    @Query('cursor') cursor: { id: string; createdAt: string },
    @Query('is_draft') isDraft: boolean,
  ) {
    return this.articleService.findAll({
      projectId,
      sectionType,
      cursor,
      isDraft,
    });
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.articleService.findById(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() payload: UpdateArticleDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.articleService.update(id, { ...payload, image });
  }

  @Post('refresh')
  refresh() {
    // @ts-ignore
    this.articleService.fetchScheduler();
    return { message: 'scheduler is triggered' };
  }

  @Post('drafts')
  async publishArticle(@Body() payload: PublishArticleDto) {
    return this.articleService.publishArticle(payload);
  }
}
