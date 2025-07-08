import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArticleModule } from './article/article.module';
import { PrismaService } from './prisma/prisma.service';
import { GeneratorModule } from './generator/generator.module';
import { DockerModule } from './docker/docker.module';
import { ProjectModule } from './project/project.module';
import { PrismaModule } from './prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { TranscriberModule } from './transcriber/transcriber.module';
import { MinioModule } from './minio/minio.module';

@Module({
  imports: [
    ArticleModule,
    PrismaModule,
    GeneratorModule,
    DockerModule,
    ProjectModule,
    TranscriberModule,
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    MinioModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
