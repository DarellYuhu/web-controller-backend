import { Injectable } from '@nestjs/common';
import { Client } from 'minio';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MinioService {
  private minio: Client;
  constructor(private readonly prisma: PrismaService) {
    this.minio = new Client({
      endPoint: process.env.MINIO_HOST || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000'),
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
      useSSL: false,
    });
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
}
