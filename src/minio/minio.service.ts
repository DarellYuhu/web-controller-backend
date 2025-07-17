import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { execa } from 'execa';
import { Client } from 'minio';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MinioService implements OnModuleInit {
  private minio: Client;
  private readonly logger = new Logger(MinioService.name);
  constructor(private readonly prisma: PrismaService) {
    this.minio = new Client({
      endPoint: process.env.MINIO_HOST || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
      useSSL: false,
    });
  }

  async onModuleInit() {
    try {
      await execa('mc', [
        'alias',
        'set',
        'myminio', // alias name
        `http://${process.env.MINIO_HOST}:${process.env.MINIO_PORT}`, // endpoint
        process.env.MINIO_ACCESS_KEY ?? '', // access key
        process.env.MINIO_SECRET_KEY ?? '', // secret key
      ]);
    } catch (error) {
      this.logger.error('Fail set minio alias');
      throw error;
    }
  }

  async addFile(payload: AddImagePayload) {
    await this.minio.putObject('media', payload.path, payload.buffer);
    const file = await this.prisma.file.create({
      data: {
        path: payload.path,
        name: payload.name,
        fullPath: `${payload.bucket}/${payload.path}`,
        bucket: payload.bucket,
        contentType: payload.contentType,
      },
    });

    return file.id;
  }

  async getImageUrl(bucketName: string, path: string) {
    return this.minio.presignedGetObject(bucketName, path);
  }

  async copyObjectToLocal(from: string, to: string) {
    await execa('mc', ['cp', `myminio/${from}`, to]);
  }
}
