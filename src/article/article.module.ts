import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bullmq';
import { MinioModule } from 'src/minio/minio.module';
import { AuthorModule } from 'src/author/author.module';
import { TagModule } from 'src/tag/tag.module';
import { ProjectModule } from 'src/project/project.module';

@Module({
  imports: [
    MinioModule,
    AuthorModule,
    TagModule,
    ProjectModule,
    HttpModule.register({
      baseURL: 'https://kuda.hitam.id/pavid/en/api',
    }),
    BullModule.registerQueue({
      name: 'article',
    }),
  ],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class ArticleModule {}
