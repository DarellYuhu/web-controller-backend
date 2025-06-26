import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArticleModule } from './article/article.module';
import { PrismaService } from './prisma/prisma.service';
import { GeneratorModule } from './generator/generator.module';
import { DockerModule } from './docker/docker.module';

@Module({
  imports: [ArticleModule, GeneratorModule, DockerModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
