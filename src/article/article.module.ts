import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { HttpModule } from '@nestjs/axios';
import { AuthorModule } from 'src/author/author.module';
import { TagModule } from 'src/tag/tag.module';

@Module({
  imports: [
    AuthorModule,
    TagModule,
    HttpModule.register({
      baseURL: process.env.NEWS_PORTAL_URL,
    }),
  ],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class ArticleModule {}
