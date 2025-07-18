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
import { AuthorModule } from './author/author.module';
import { TagModule } from './tag/tag.module';
import { WhitelistModule } from './whitelist/whitelist.module';
import { CategoryModule } from './category/category.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ArticleModule,
    ConfigModule.forRoot({ ignoreEnvFile: true }),
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
    AuthorModule,
    TagModule,
    WhitelistModule,
    CategoryModule,
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
