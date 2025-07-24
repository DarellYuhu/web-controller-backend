import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { HttpModule } from '@nestjs/axios';
import { AuthorModule } from 'src/author/author.module';
import { TagModule } from 'src/tag/tag.module';
import { ProjectModule } from 'src/project/project.module';

@Module({
  imports: [
    AuthorModule,
    TagModule,
    ProjectModule,
    HttpModule.register({
      baseURL: 'https://kuda.hitam.id/pavid/en/api',
    }),
  ],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class ArticleModule {}
