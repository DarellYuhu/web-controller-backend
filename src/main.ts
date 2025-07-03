import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import metadata from './metadata';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder().setTitle('Web Controller API').build();
  await SwaggerModule.loadPluginMetadata(metadata);
  const document = SwaggerModule.createDocument(app, config);
  app.use('/api-docs', apiReference({ content: document, layout: 'classic' }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors({ origin: process.env.ALLOWED_ORIGINS?.split(',') });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
